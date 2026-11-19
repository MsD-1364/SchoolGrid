'use client';

import { useEffect, useMemo, useState } from 'react';
import SupaBaseClientFunction from '../../lib/SupaBaseClient/SupaBaseClientFunction';

const INACTIVE_STORAGE_KEY = 'our_schools_inactive_ids_v1';

const EMPTY_FORM = {
  school_title: '',
  school_manager: '',
  is_private: true,
  is_active: true,
  loc_state: '',
  loc_district: '',
  loc_city_village: '',
  local_address: '',
  user_uuid: '',
};

export default function AllSchoolsInfo() {
  const [schools, setSchools] = useState([]);
  const [inactiveIds, setInactiveIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [realtimeStatus, setRealtimeStatus] = useState('CONNECTING');
  const [busyId, setBusyId] = useState(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  // Floating Message Box state (no window.alert)
  const [msgBox, setMsgBox] = useState(null);

  // Custom Confirm Dialog state (no window.confirm)
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [confirmRunning, setConfirmRunning] = useState(false);

  // Selection state
  const [selectedIds, setSelectedIds] = useState([]);

  // Filter & search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('ALL');
  const [selectedDistrict, setSelectedDistrict] = useState('ALL');
  const [selectedVillage, setSelectedVillage] = useState('ALL');
  const [schoolType, setSchoolType] = useState('ALL'); // 'ALL' | 'PRIVATE' | 'PUBLIC'
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE'

  // Create / Edit modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const showMessageBox = (type, title, text) => {
    setMsgBox({ id: Date.now(), type, title, text });
  };

  useEffect(() => {
    if (!msgBox) return;
    const timer = setTimeout(() => {
      setMsgBox(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [msgBox]);

  // Load persisted inactive school IDs from localStorage
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(INACTIVE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setInactiveIds(parsed);
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const updateInactiveIds = (updater) => {
    setInactiveIds((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try {
        window.localStorage.setItem(INACTIVE_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  const isSchoolActive = (school) => !inactiveIds.includes(school.school_id);

  useEffect(() => {
    let isMounted = true;
    const supabase = SupaBaseClientFunction();

    async function fetchSchools() {
      setLoading(true);
      setError(null);

      try {
        const { data, error: supabaseError } = await supabase
          .from('OurSchools')
          .select(
            `
            school_id,
            created_at,
            school_title,
            school_manager,
            is_private,
            loc_state,
            loc_district,
            loc_city_village,
            local_address,
            user_uuid
          `
          )
          .order('created_at', { ascending: false });

        if (supabaseError) throw supabaseError;
        if (isMounted) {
          setSchools(data || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load schools.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchSchools();

    const channel = supabase
      .channel('our-schools-realtime-crud')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'OurSchools',
        },
        (payload) => {
          if (!isMounted) return;

          if (payload.eventType === 'INSERT') {
            setSchools((prev) => {
              if (prev.some((item) => item.school_id === payload.new.school_id)) {
                return prev;
              }
              return [payload.new, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            setSchools((prev) =>
              prev.map((item) =>
                item.school_id === payload.new.school_id ? { ...item, ...payload.new } : item
              )
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old?.school_id;
            if (deletedId) {
              setSchools((prev) => prev.filter((item) => item.school_id !== deletedId));
              setSelectedIds((prev) => prev.filter((id) => id !== deletedId));
              updateInactiveIds((prev) => prev.filter((id) => id !== deletedId));
            }
          }
        }
      )
      .subscribe((status) => {
        if (isMounted) {
          setRealtimeStatus(status);
        }
      });

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Cascading filter options
  const stateOptions = useMemo(() => {
    const values = schools.map((s) => s.loc_state?.trim()).filter(Boolean);
    return Array.from(new Set(values)).sort();
  }, [schools]);

  const districtOptions = useMemo(() => {
    const values = schools
      .filter((s) => selectedState === 'ALL' || s.loc_state?.trim() === selectedState)
      .map((s) => s.loc_district?.trim())
      .filter(Boolean);
    return Array.from(new Set(values)).sort();
  }, [schools, selectedState]);

  const villageOptions = useMemo(() => {
    const values = schools
      .filter((s) => {
        const matchState = selectedState === 'ALL' || s.loc_state?.trim() === selectedState;
        const matchDistrict =
          selectedDistrict === 'ALL' || s.loc_district?.trim() === selectedDistrict;
        return matchState && matchDistrict;
      })
      .map((s) => s.loc_city_village?.trim())
      .filter(Boolean);
    return Array.from(new Set(values)).sort();
  }, [schools, selectedState, selectedDistrict]);

  const handleStateChange = (value) => {
    setSelectedState(value);
    setSelectedDistrict('ALL');
    setSelectedVillage('ALL');
  };

  const handleDistrictChange = (value) => {
    setSelectedDistrict(value);
    setSelectedVillage('ALL');
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedState('ALL');
    setSelectedDistrict('ALL');
    setSelectedVillage('ALL');
    setSchoolType('ALL');
    setStatusFilter('ALL');
  };

  // Filtered list
  const filteredSchools = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return schools.filter((school) => {
      if (selectedState !== 'ALL' && school.loc_state?.trim() !== selectedState) return false;
      if (selectedDistrict !== 'ALL' && school.loc_district?.trim() !== selectedDistrict) return false;
      if (selectedVillage !== 'ALL' && school.loc_city_village?.trim() !== selectedVillage)
        return false;
      if (schoolType === 'PRIVATE' && school.is_private !== true) return false;
      if (schoolType === 'PUBLIC' && school.is_private !== false) return false;

      const active = !inactiveIds.includes(school.school_id);
      if (statusFilter === 'ACTIVE' && !active) return false;
      if (statusFilter === 'INACTIVE' && active) return false;

      if (!q) return true;

      const searchableFields = [
        school.school_title,
        school.school_manager,
        school.loc_state,
        school.loc_district,
        school.loc_city_village,
        school.local_address,
      ];

      return searchableFields.some((field) =>
        String(field || '')
          .toLowerCase()
          .includes(q)
      );
    });
  }, [
    schools,
    inactiveIds,
    searchQuery,
    selectedState,
    selectedDistrict,
    selectedVillage,
    schoolType,
    statusFilter,
  ]);

  // Selection helpers
  const allFilteredSelected =
    filteredSchools.length > 0 &&
    filteredSchools.every((s) => selectedIds.includes(s.school_id));

  const toggleSelectOne = (schoolId) => {
    setSelectedIds((prev) =>
      prev.includes(schoolId) ? prev.filter((id) => id !== schoolId) : [...prev, schoolId]
    );
  };

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      const filteredSet = new Set(filteredSchools.map((s) => s.school_id));
      setSelectedIds((prev) => prev.filter((id) => !filteredSet.has(id)));
    } else {
      const merged = new Set([...selectedIds, ...filteredSchools.map((s) => s.school_id)]);
      setSelectedIds(Array.from(merged));
    }
  };

  // Modal open handlers
  const openCreateModal = () => {
    setEditingSchool(null);
    setFormData(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEditModal = (school) => {
    setEditingSchool(school);
    setFormData({
      school_title: school.school_title || '',
      school_manager: school.school_manager || '',
      is_private: Boolean(school.is_private),
      is_active: isSchoolActive(school),
      loc_state: school.loc_state || '',
      loc_district: school.loc_district || '',
      loc_city_village: school.loc_city_village || '',
      local_address: school.local_address || '',
      user_uuid: school.user_uuid || '',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingSchool(null);
    setFormData(EMPTY_FORM);
  };

  // Create / Update submit (strictly uses existing table columns)
  const handleSaveSchool = async (e) => {
    e.preventDefault();
    if (!formData.school_title.trim()) {
      showMessageBox('error', 'Validation Error', 'School title is required.');
      return;
    }

    setSaving(true);
    const supabase = SupaBaseClientFunction();

    const dbPayload = {
      school_title: formData.school_title.trim(),
      school_manager: formData.school_manager.trim() || null,
      is_private: Boolean(formData.is_private),
      loc_state: formData.loc_state.trim() || null,
      loc_district: formData.loc_district.trim() || null,
      loc_city_village: formData.loc_city_village.trim() || null,
      local_address: formData.local_address.trim() || null,
      user_uuid: formData.user_uuid.trim() || null,
    };

    try {
      if (editingSchool) {
        const { data, error: updateError } = await supabase
          .from('OurSchools')
          .update(dbPayload)
          .eq('school_id', editingSchool.school_id)
          .select();

        if (updateError) throw updateError;
        if (!data || data.length === 0) {
          throw new Error(
            'No row was updated. Check your Supabase RLS UPDATE policy on OurSchools.'
          );
        }

        const updatedRow = data[0];
        setSchools((prev) =>
          prev.map((item) => (item.school_id === updatedRow.school_id ? updatedRow : item))
        );

        // Sync active/inactive toggle state for this school
        updateInactiveIds((prev) => {
          const without = prev.filter((id) => id !== updatedRow.school_id);
          return formData.is_active ? without : [...without, updatedRow.school_id];
        });

        showMessageBox('success', 'School Updated', `"${updatedRow.school_title}" has been saved.`);
      } else {
        const { data, error: insertError } = await supabase
          .from('OurSchools')
          .insert([dbPayload])
          .select();

        if (insertError) throw insertError;
        const createdRow = data?.[0];
        if (createdRow) {
          setSchools((prev) =>
            prev.some((item) => item.school_id === createdRow.school_id)
              ? prev
              : [createdRow, ...prev]
          );

          if (!formData.is_active) {
            updateInactiveIds((prev) =>
              prev.includes(createdRow.school_id) ? prev : [...prev, createdRow.school_id]
            );
          }
        }
        showMessageBox('success', 'School Created', `"${dbPayload.school_title}" has been added.`);
      }

      setModalOpen(false);
      setEditingSchool(null);
      setFormData(EMPTY_FORM);
    } catch (err) {
      showMessageBox('error', 'Save Failed', err.message || 'Could not save school.');
    } finally {
      setSaving(false);
    }
  };

  // Active / Deactivate single school (no schema change required)
  const handleToggleActive = (school) => {
    const currentlyActive = isSchoolActive(school);
    const nextActive = !currentlyActive;

    updateInactiveIds((prev) => {
      const without = prev.filter((id) => id !== school.school_id);
      return nextActive ? without : [...without, school.school_id];
    });

    showMessageBox(
      'success',
      nextActive ? 'School Activated' : 'School Deactivated',
      `"${school.school_title || 'School'}" is now ${nextActive ? 'Active' : 'Inactive'}.`
    );
  };

  // Ask confirmation via custom dialog before deleting single school
  const requestDeleteOne = (school) => {
    setConfirmDialog({
      title: 'Delete School',
      message: `Are you sure you want to permanently delete "${school.school_title || 'this school'}"? This action cannot be undone.`,
      confirmLabel: 'Delete School',
      tone: 'danger',
      onConfirm: async () => {
        setBusyId(school.school_id);
        const supabase = SupaBaseClientFunction();

        try {
          const { error: deleteError } = await supabase
            .from('OurSchools')
            .delete()
            .eq('school_id', school.school_id);

          if (deleteError) throw deleteError;

          setSchools((prev) => prev.filter((item) => item.school_id !== school.school_id));
          setSelectedIds((prev) => prev.filter((id) => id !== school.school_id));
          updateInactiveIds((prev) => prev.filter((id) => id !== school.school_id));
          showMessageBox(
            'success',
            'School Deleted',
            `"${school.school_title || 'School'}" was removed.`
          );
        } catch (err) {
          showMessageBox('error', 'Delete Failed', err.message || 'Could not delete school.');
        } finally {
          setBusyId(null);
        }
      },
    });
  };

  // Bulk Active / Deactivate
  const handleBulkStatusChange = (nextActive) => {
    if (selectedIds.length === 0) return;

    const selectedSet = new Set(selectedIds);
    updateInactiveIds((prev) => {
      const remaining = prev.filter((id) => !selectedSet.has(id));
      return nextActive ? remaining : [...remaining, ...selectedIds];
    });

    showMessageBox(
      'success',
      nextActive ? 'Schools Activated' : 'Schools Deactivated',
      `${selectedIds.length} selected school(s) marked as ${nextActive ? 'Active' : 'Inactive'}.`
    );
  };

  // Ask confirmation via custom dialog before bulk delete
  const requestBulkDelete = () => {
    if (selectedIds.length === 0) return;

    setConfirmDialog({
      title: 'Delete Selected Schools',
      message: `Are you sure you want to permanently delete ${selectedIds.length} selected school(s)? This action cannot be undone.`,
      confirmLabel: `Delete (${selectedIds.length})`,
      tone: 'danger',
      onConfirm: async () => {
        setBulkBusy(true);
        const supabase = SupaBaseClientFunction();

        try {
          const { error: bulkDeleteError } = await supabase
            .from('OurSchools')
            .delete()
            .in('school_id', selectedIds);

          if (bulkDeleteError) throw bulkDeleteError;

          const deletedSet = new Set(selectedIds);
          const deletedCount = selectedIds.length;
          setSchools((prev) => prev.filter((item) => !deletedSet.has(item.school_id)));
          updateInactiveIds((prev) => prev.filter((id) => !deletedSet.has(id)));
          setSelectedIds([]);
          showMessageBox(
            'success',
            'Schools Deleted',
            `${deletedCount} selected school(s) have been deleted.`
          );
        } catch (err) {
          showMessageBox(
            'error',
            'Bulk Delete Failed',
            err.message || 'Could not delete selected schools.'
          );
        } finally {
          setBulkBusy(false);
        }
      },
    });
  };

  const executeConfirmDialog = async () => {
    if (!confirmDialog?.onConfirm || confirmRunning) return;
    setConfirmRunning(true);
    try {
      await confirmDialog.onConfirm();
    } finally {
      setConfirmRunning(false);
      setConfirmDialog(null);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-gray-500">Loading schools...</div>;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Error loading schools: {error}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      {/* Floating Custom Message Box (No window.alert) */}
      {msgBox && (
        <div
          role="alert"
          className={`fixed bottom-5 right-5 z-50 w-full max-w-sm rounded-xl border p-4 shadow-lg transition ${
            msgBox.type === 'success'
              ? 'border-emerald-200 bg-white text-gray-900'
              : msgBox.type === 'error'
                ? 'border-red-200 bg-white text-gray-900'
                : 'border-blue-200 bg-white text-gray-900'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <span
                className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                  msgBox.type === 'success'
                    ? 'bg-emerald-500'
                    : msgBox.type === 'error'
                      ? 'bg-red-500'
                      : 'bg-blue-500'
                }`}
              />
              <div>
                <p className="text-sm font-semibold text-gray-900">{msgBox.title}</p>
                <p className="mt-0.5 text-xs text-gray-600">{msgBox.text}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMsgBox(null)}
              className="rounded px-1.5 py-0.5 text-xs font-medium text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Custom Confirmation Message Box Modal (No window.confirm) */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900">{confirmDialog.title}</h3>
            <p className="mt-2 text-sm text-gray-600">{confirmDialog.message}</p>

            <div className="mt-5 flex justify-end gap-2.5">
              <button
                type="button"
                disabled={confirmRunning}
                onClick={() => setConfirmDialog(null)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={confirmRunning}
                onClick={executeConfirmDialog}
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
                  confirmDialog.tone === 'danger'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {confirmRunning ? 'Processing...' : confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-gray-900">Our Schools</h1>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                realtimeStatus === 'SUBSCRIBED'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  realtimeStatus === 'SUBSCRIBED'
                    ? 'animate-pulse bg-emerald-500'
                    : 'bg-amber-500'
                }`}
              />
              {realtimeStatus === 'SUBSCRIBED' ? 'Live' : realtimeStatus}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Showing {filteredSchools.length} of {schools.length} schools
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleResetFilters}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Reset Filters
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Add School
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <label htmlFor="school-search" className="mb-1 block text-xs font-medium text-gray-600">
            Search
          </label>
          <input
            id="school-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by school name, manager, or address..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="state-filter" className="mb-1 block text-xs font-medium text-gray-600">
            State
          </label>
          <select
            id="state-filter"
            value={selectedState}
            onChange={(e) => handleStateChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="ALL">All States</option>
            {stateOptions.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="district-filter"
            className="mb-1 block text-xs font-medium text-gray-600"
          >
            District
          </label>
          <select
            id="district-filter"
            value={selectedDistrict}
            onChange={(e) => handleDistrictChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="ALL">All Districts</option>
            {districtOptions.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="village-filter"
            className="mb-1 block text-xs font-medium text-gray-600"
          >
            City / Village
          </label>
          <select
            id="village-filter"
            value={selectedVillage}
            onChange={(e) => setSelectedVillage(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="ALL">All Cities / Villages</option>
            {villageOptions.map((village) => (
              <option key={village} value={village}>
                {village}
              </option>
            ))}
          </select>
        </div>

        {/* Type & Active Status Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 sm:col-span-2 lg:col-span-5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs font-medium text-gray-600">Type:</span>
            {[
              { key: 'ALL', label: 'All' },
              { key: 'PRIVATE', label: 'Private' },
              { key: 'PUBLIC', label: 'Non-Private' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSchoolType(tab.key)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  schoolType === tab.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs font-medium text-gray-600">Status:</span>
            {[
              { key: 'ALL', label: 'All' },
              { key: 'ACTIVE', label: 'Active' },
              { key: 'INACTIVE', label: 'Inactive' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  statusFilter === tab.key
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Selection & Bulk Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={allFilteredSelected}
            onChange={toggleSelectAllFiltered}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span>Select Filtered ({selectedIds.length} selected)</span>
        </label>

        {selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={bulkBusy}
              onClick={() => handleBulkStatusChange(true)}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              Activate Selected
            </button>
            <button
              type="button"
              disabled={bulkBusy}
              onClick={() => handleBulkStatusChange(false)}
              className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50"
            >
              Deactivate Selected
            </button>
            <button
              type="button"
              disabled={bulkBusy}
              onClick={requestBulkDelete}
              className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              Delete Selected
            </button>
            <button
              type="button"
              disabled={bulkBusy}
              onClick={() => setSelectedIds([])}
              className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Results Grid */}
      {filteredSchools.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-sm text-gray-500">
          No schools match your current search or filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSchools.map((school) => {
            const isSelected = selectedIds.includes(school.school_id);
            const active = isSchoolActive(school);
            const isRowBusy = busyId === school.school_id;

            return (
              <article
                key={school.school_id}
                className={`flex flex-col justify-between rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md ${
                  isSelected ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200'
                } ${!active ? 'bg-gray-50/70' : ''}`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <label className="flex cursor-pointer items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(school.school_id)}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <h2 className="text-lg font-semibold text-gray-900">
                        {school.school_title || 'Untitled School'}
                      </h2>
                    </label>

                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          active
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {active ? 'Active' : 'Inactive'}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          school.is_private
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-sky-100 text-sky-800'
                        }`}
                      >
                        {school.is_private ? 'Private' : 'Non-Private'}
                      </span>
                    </div>
                  </div>

                  {school.school_manager && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-gray-700">Manager:</span>{' '}
                      {school.school_manager}
                    </p>
                  )}

                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-gray-700">Location:</span>{' '}
                    {[school.loc_city_village, school.loc_district, school.loc_state]
                      .filter(Boolean)
                      .join(', ') || 'Not specified'}
                  </p>

                  {school.local_address && (
                    <p className="text-xs text-gray-500">
                      <span className="font-medium text-gray-600">Address:</span>{' '}
                      {school.local_address}
                    </p>
                  )}
                </div>

                {/* Card Footer & CRUD Actions */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3">
                  <span className="text-xs text-gray-400">
                    {school.created_at
                      ? new Date(school.created_at).toLocaleDateString()
                      : '—'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={isRowBusy}
                      onClick={() => handleToggleActive(school)}
                      className={`rounded px-2.5 py-1 text-xs font-medium disabled:opacity-50 ${
                        active
                          ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {active ? 'Deactivate' : 'Activate'}
                    </button>

                    <button
                      type="button"
                      disabled={isRowBusy}
                      onClick={() => openEditModal(school)}
                      className="rounded bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      disabled={isRowBusy}
                      onClick={() => requestDeleteOne(school)}
                      className="rounded bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900">
              {editingSchool ? 'Edit School' : 'Add New School'}
            </h2>

            <form onSubmit={handleSaveSchool} className="mt-4 space-y-3.5">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  School Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.school_title}
                  onChange={(e) => setFormData({ ...formData, school_title: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  School Manager
                </label>
                <input
                  type="text"
                  value={formData.school_manager}
                  onChange={(e) => setFormData({ ...formData, school_manager: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">State</label>
                  <input
                    type="text"
                    value={formData.loc_state}
                    onChange={(e) => setFormData({ ...formData, loc_state: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">District</label>
                  <input
                    type="text"
                    value={formData.loc_district}
                    onChange={(e) => setFormData({ ...formData, loc_district: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    City / Village
                  </label>
                  <input
                    type="text"
                    value={formData.loc_city_village}
                    onChange={(e) =>
                      setFormData({ ...formData, loc_city_village: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Local Address
                </label>
                <textarea
                  rows={2}
                  value={formData.local_address}
                  onChange={(e) => setFormData({ ...formData, local_address: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Owner User UUID (optional)
                </label>
                <input
                  type="text"
                  value={formData.user_uuid}
                  onChange={(e) => setFormData({ ...formData, user_uuid: e.target.value })}
                  placeholder="Leave blank if none"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-1">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={formData.is_private}
                    onChange={(e) => setFormData({ ...formData, is_private: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  />
                  Private School
                </label>

                <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600"
                  />
                  Active Status
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingSchool ? 'Save Changes' : 'Create School'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}