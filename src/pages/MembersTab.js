// src/pages/MembersTab.js
import React, { useState, useMemo, useRef, useEffect } from 'react';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import MultiSelect from '../components/MultiSelect';
import { SearchIcon, DownloadIcon } from '../components/Icons';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

function uniqueValues(members, key) {
  return [...new Set(members.map((m) => m[key]).filter(Boolean))].sort();
}

const EXPORT_HEADERS = ['নাম', 'ইমেইল', 'ফোন', 'জেলা', 'বিশ্ববিদ্যালয়', 'বিষয়', 'বর্তমান প্রতিষ্ঠান', 'পদবী', 'বিভাগ', 'স্ট্যাটাস'];

function rowsFor(members) {
  return members.map((m) => [
    m.name || '', m.email || '', m.phone || '', m.district || '', m.university || '',
    m.subject || '', m.current_company || '', m.designation || '', m.department || '',
    m.status === 'Resigned' ? 'Resigned' : 'Active',
  ]);
}

function exportCSV(members) {
  const rows = rowsFor(members);
  const csv = [EXPORT_HEADERS, ...rows].map((r) => r.map((c) => `"${(c || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'petro-hub-members.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function exportExcel(members) {
  const rows = rowsFor(members);
  const sheetData = [EXPORT_HEADERS, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  ws['!cols'] = EXPORT_HEADERS.map(() => ({ wch: 18 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Members');
  XLSX.writeFile(wb, 'petro-hub-members.xlsx');
}

function exportPDF(members) {
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFontSize(14);
  doc.text('Petro Knowledge Hub - Member List', 14, 14);
  doc.setFontSize(9);
  doc.text(`Total: ${members.length} members | Generated: ${new Date().toLocaleDateString()}`, 14, 20);

  // PDF এ বাংলা ফন্ট সরাসরি না থাকায় headers ও data রোমান হরফে রাখা হলো
  // (jsPDF default font বাংলা ইউনিকোড render করতে পারে না)
  const enHeaders = ['Name', 'Email', 'Phone', 'District', 'University', 'Subject', 'Company', 'Designation', 'Department', 'Status'];
  const rows = members.map((m) => [
    m.name || '', m.email || '', m.phone || '', m.district || '', m.university || '',
    m.subject || '', m.current_company || '', m.designation || '', m.department || '',
    m.status === 'Resigned' ? 'Resigned' : 'Active',
  ]);

  autoTable(doc, {
    head: [enHeaders],
    body: rows,
    startY: 26,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [14, 165, 233] },
  });

  doc.save('petro-hub-members.pdf');
}

export default function MembersTab({ members, onOpenProfile }) {
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState([]);
  const [universityFilter, setUniversityFilter] = useState([]);
  const [companyFilter, setCompanyFilter] = useState([]);
  const [subjectFilter, setSubjectFilter] = useState([]);
  const [departmentFilter, setDepartmentFilter] = useState([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (exportRef.current && !exportRef.current.contains(e.target)) setShowExportMenu(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const districts = useMemo(() => uniqueValues(members, 'district'), [members]);
  const universities = useMemo(() => uniqueValues(members, 'university'), [members]);
  const companies = useMemo(() => uniqueValues(members, 'current_company'), [members]);
  const subjects = useMemo(() => uniqueValues(members, 'subject'), [members]);
  const departments = useMemo(() => uniqueValues(members, 'department'), [members]);

  const filtered = useMemo(() => {
    return members.filter((m) => {
      const matchesSearch = !search || [m.name, m.district, m.university, m.subject, m.current_company, m.department]
        .some((v) => (v || '').toLowerCase().includes(search.toLowerCase()));
      const matchesDistrict = districtFilter.length === 0 || districtFilter.includes(m.district);
      const matchesUniversity = universityFilter.length === 0 || universityFilter.includes(m.university);
      const matchesCompany = companyFilter.length === 0 || companyFilter.includes(m.current_company);
      const matchesSubject = subjectFilter.length === 0 || subjectFilter.includes(m.subject);
      const matchesDepartment = departmentFilter.length === 0 || departmentFilter.includes(m.department);
      return matchesSearch && matchesDistrict && matchesUniversity && matchesCompany && matchesSubject && matchesDepartment;
    });
  }, [members, search, districtFilter, universityFilter, companyFilter, subjectFilter, departmentFilter]);

  function handleExport(type) {
    setShowExportMenu(false);
    if (type === 'csv') exportCSV(filtered);
    if (type === 'pdf') exportPDF(filtered);
    if (type === 'excel') exportExcel(filtered);
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '16px 14px 90px' }}>
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <SearchIcon width={18} height={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="নাম, জেলা, বিশ্ববিদ্যালয় দিয়ে খুঁজুন..."
          style={{
            width: '100%', padding: '12px 14px 12px 40px', borderRadius: 14, border: `1.5px solid var(--border)`,
            fontSize: 14, outline: 'none', boxSizing: 'border-box', background: 'var(--bg-surface)',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        <MultiSelect label="জেলা" options={districts} selected={districtFilter} onChange={setDistrictFilter} />
        <MultiSelect label="বিশ্ববিদ্যালয়" options={universities} selected={universityFilter} onChange={setUniversityFilter} />
        <MultiSelect label="বিষয়" options={subjects} selected={subjectFilter} onChange={setSubjectFilter} />
        <MultiSelect label="প্রতিষ্ঠান" options={companies} selected={companyFilter} onChange={setCompanyFilter} />
        <MultiSelect label="বিভাগ" options={departments} selected={departmentFilter} onChange={setDepartmentFilter} />

        <div ref={exportRef} style={{ position: 'relative', marginLeft: 'auto' }}>
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10,
              border: `1.5px solid var(--border)`, background: 'var(--bg-surface)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <DownloadIcon width={14} height={14} /> Export
          </button>
          {showExportMenu && (
            <div style={{
              position: 'absolute', top: 38, right: 0, background: 'var(--bg-surface)', borderRadius: 12, padding: 6,
              boxShadow: '0 12px 32px rgba(0,0,0,0.18)', zIndex: 20, minWidth: 140,
            }}>
              {[
                ['csv', 'CSV (.csv)'],
                ['excel', 'Excel (.xlsx)'],
                ['pdf', 'PDF (.pdf)'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => handleExport(key)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 8,
                    border: 'none', background: 'none', fontSize: 13, color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--border-soft)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>{filtered.length} জন সদস্য পাওয়া গেছে</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
        {filtered.map((m) => (
          <div
            key={m.id}
            onClick={() => onOpenProfile(m)}
            style={{
              background: 'var(--bg-surface)', borderRadius: 16, padding: 16, textAlign: 'center', cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(0,0,0,0.06)', transition: 'transform 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <Avatar name={m.name} src={m.avatar_url} size={56} />
            <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)', marginTop: 8 }}>{m.name}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>{m.district || '—'}</div>
            {m.current_company && (
              <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 1 }}>{m.current_company}</div>
            )}
            <div style={{ marginTop: 6 }}>
              <Badge tone={m.status === 'Resigned' ? 'danger' : 'success'}>
                {m.status === 'Resigned' ? 'Resigned' : 'Active'}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
