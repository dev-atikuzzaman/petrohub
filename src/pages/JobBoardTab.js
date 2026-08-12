// src/pages/JobBoardTab.js
import React, { useState } from 'react';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import CreateJobModal from '../components/CreateJobModal';
import { PlusIcon, BriefcaseIcon, MapPinIcon, ClockIcon, MailIcon, TrashIcon } from '../components/Icons';
import { deleteJobPosting } from '../lib/dataService';

const JOB_TYPE_LABELS = {
  full_time: 'ফুল-টাইম',
  part_time: 'পার্ট-টাইম',
  internship: 'ইন্টার্নশিপ',
  contract: 'কন্ট্রাক্ট',
  referral: 'রেফারেল',
  transfer: 'ট্রান্সফার সুযোগ',
};

const JOB_TYPE_TONE = {
  full_time: 'success',
  part_time: 'info',
  internship: 'warning',
  contract: 'default',
  referral: 'admin',
  transfer: 'danger',
};

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'এইমাত্র';
  if (diff < 3600) return `${Math.floor(diff / 60)} মিনিট আগে`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ঘণ্টা আগে`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} দিন আগে`;
  return new Date(dateStr).toLocaleDateString('bn-BD');
}

function isExpired(deadline) {
  return deadline && new Date(deadline).getTime() < Date.now();
}

export default function JobBoardTab({ jobs, currentUser, isAdmin, onOpenProfile, onUpdate }) {
  const [showCreate, setShowCreate] = useState(false);
  const [filterType, setFilterType] = useState(null);

  const visibleJobs = filterType ? jobs.filter((j) => j.job_type === filterType) : jobs;

  async function handleDelete(id) {
    if (!window.confirm('এই পোস্টটি মুছে ফেলতে চান?')) return;
    await deleteJobPosting(id);
    onUpdate && onUpdate();
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '16px 14px 90px' }}>
      <button
        onClick={() => setShowCreate(true)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '13px', borderRadius: 14, border: 'none', marginBottom: 16,
          background: 'var(--accent-gradient)', color: '#fff',
          fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 6px 16px rgba(14,165,233,0.25)',
        }}
      >
        <PlusIcon width={18} height={18} /> নতুন সুযোগ পোস্ট করুন
      </button>

      <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 4, marginBottom: 14 }}>
        <button
          onClick={() => setFilterType(null)}
          style={{
            flexShrink: 0, padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 700,
            background: !filterType ? 'var(--accent-gradient)' : 'var(--bg-surface-alt)',
            color: !filterType ? '#fff' : 'var(--text-secondary)',
          }}
        >
          সব
        </button>
        {Object.entries(JOB_TYPE_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilterType(filterType === key ? null : key)}
            style={{
              flexShrink: 0, padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 700,
              background: filterType === key ? 'var(--accent-gradient)' : 'var(--bg-surface-alt)',
              color: filterType === key ? '#fff' : 'var(--text-secondary)',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {visibleJobs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>💼</div>
          <div style={{ fontSize: 14 }}>এখনো কোনো সুযোগ পোস্ট করা হয়নি</div>
        </div>
      ) : (
        visibleJobs.map((job) => {
          const expired = isExpired(job.deadline);
          const canManage = job.posted_by === currentUser.id || isAdmin;
          return (
            <div
              key={job.id}
              style={{
                background: 'var(--bg-surface)', borderRadius: 18, padding: 18, marginBottom: 14,
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)', opacity: expired ? 0.6 : 1,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <Badge tone={JOB_TYPE_TONE[job.job_type] || 'default'}>{JOB_TYPE_LABELS[job.job_type] || job.job_type}</Badge>
                  {expired && <Badge tone="danger">মেয়াদোত্তীর্ণ</Badge>}
                </div>
                {canManage && (
                  <button onClick={() => handleDelete(job.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
                    <TrashIcon width={15} height={15} />
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <BriefcaseIcon width={19} height={19} color="var(--accent)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 15.5, color: 'var(--text-primary)' }}>{job.title}</div>
                  {job.company && <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>{job.company}</div>}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                {job.location && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPinIcon width={12} height={12} /> {job.location}
                  </span>
                )}
                {job.deadline && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <ClockIcon width={12} height={12} /> শেষ তারিখ: {new Date(job.deadline).toLocaleDateString('bn-BD')}
                  </span>
                )}
              </div>

              {job.description && (
                <div style={{ fontSize: 13.5, color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: 10, whiteSpace: 'pre-wrap' }}>
                  {job.description}
                </div>
              )}

              {job.contact_info && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--accent)', fontWeight: 700, marginBottom: 12 }}>
                  <MailIcon width={13} height={13} /> {job.contact_info}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 10, borderTop: '1px solid var(--border-soft)' }}>
                <Avatar name={job.poster?.name} src={job.poster?.avatar_url} size={26} onClick={() => onOpenProfile && onOpenProfile(job.poster)} />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  পোস্ট করেছেন <b style={{ color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={() => onOpenProfile && onOpenProfile(job.poster)}>{job.poster?.name}</b> · {timeAgo(job.created_at)}
                </span>
              </div>
            </div>
          );
        })
      )}

      {showCreate && (
        <CreateJobModal
          currentUser={currentUser}
          onClose={() => setShowCreate(false)}
          onCreated={onUpdate}
        />
      )}
    </div>
  );
}
