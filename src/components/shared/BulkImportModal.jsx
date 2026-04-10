import React, { useState, useRef } from 'react';
import { Upload, Download, X, AlertCircle, FileText, CheckCircle2, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import Modal from './Modal';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../services/api';

const BulkImportModal = ({ isOpen, onClose, type, role, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [results, setResults] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const { user } = useAuth();

  const handleDownloadSample = async () => {
    try {
      let url = '';
      if (type === 'users') url = `/institutions/bulk-staff/sample?role=${role}`;
      else if (type === 'batches') url = `/batches/sample`;
      else if (type === 'timetable') url = `/timetables/sample`;

      const response = await api.get(url, { responseType: 'blob' });
      const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `${type}_sample.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      toast.error('Failed to download sample file');
    }
  };

  const parseCSV = (text) => {
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = lines[i].split(',').map(v => v.trim());
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h.toLowerCase().replace(/[^a-z]/g, '')] = values[idx];
      });
      rows.push(obj);
    }
    return rows;
  };

  const processFile = (selectedFile) => {
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (event) => setData(parseCSV(event.target.result));
      reader.readAsText(selectedFile);
    } else {
      toast.error('Please select a valid CSV file');
    }
  };

  const handleFileChange = (e) => processFile(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    processFile(e.dataTransfer.files[0]);
  };

  const handleImport = async () => {
    if (!data || data.length === 0) return;
    setLoading(true);
    try {
      let url = '';
      let payload = {};

      if (type === 'users') {
        url = '/institutions/bulk-staff';
        payload = {
          users: data.map(d => ({ name: d.name, email: d.email, role: d.role || role, batch: d.batchname || d.batch })),
          sendEmail: true
        };
      } else if (type === 'batches') {
        url = '/batches/bulk';
        payload = {
          batches: data.map(d => ({
            name: d.name,
            academicYear: d.academicyear,
            subjects: d.subjects?.split(',').map(s => s.trim()) || [],
            description: d.description
          }))
        };
      } else if (type === 'timetable') {
        url = '/timetables/bulk';
        payload = {
          slots: data.map(d => ({
            day: d.day, startTime: d.starttime, endTime: d.endtime,
            subject: d.subject, batch: d.batchname || d.batch, teacher: d.teacheremail || d.teacher
          }))
        };
      }

      const response = await api.post(url, payload);
      setResults(response.data.data || response.data);
      if (onSuccess) onSuccess();
      toast.success('Import completed successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setData(null);
    setResults(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const typeName = type?.charAt(0).toUpperCase() + type?.slice(1);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Bulk Import ${typeName}`} maxWidth="2xl">
      <div className="space-y-5">
        {!results ? (
          <>
            {/* Step 1 — Download template */}
            <div
              style={{
                background: 'linear-gradient(135deg, color-mix(in srgb, var(--md-sys-color-primary) 8%, transparent), color-mix(in srgb, var(--md-sys-color-primary) 4%, transparent))',
                border: '1px solid color-mix(in srgb, var(--md-sys-color-primary) 18%, transparent)',
              }}
              className="flex items-center justify-between gap-4 p-4 rounded-2xl"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  style={{ background: 'color-mix(in srgb, var(--md-sys-color-primary) 15%, transparent)' }}
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-primary text-xs font-bold"
                >
                  1
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-on-surface text-sm">Download the CSV template</p>
                  <p className="text-xs text-on-surface-variant/60 mt-0.5 truncate">
                    Fill it with your data, then upload below
                  </p>
                </div>
              </div>
              <button
                onClick={handleDownloadSample}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-primary rounded-xl transition-all hover:bg-primary/10 active:scale-95"
              >
                <Download className="w-4 h-4" />
                Template
              </button>
            </div>

            {/* Step 2 — Upload */}
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <span
                  style={{ background: 'color-mix(in srgb, var(--md-sys-color-primary) 15%, transparent)' }}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-primary text-xs font-bold flex-shrink-0"
                >
                  2
                </span>
                <p className="font-semibold text-on-surface text-sm">Upload your CSV</p>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv"
                className="hidden"
              />

              {!file ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current.click()}
                  className="cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center gap-3 py-10"
                  style={{
                    borderColor: dragOver
                      ? 'var(--md-sys-color-primary)'
                      : 'color-mix(in srgb, var(--md-sys-color-outline) 30%, transparent)',
                    background: dragOver
                      ? 'color-mix(in srgb, var(--md-sys-color-primary) 5%, transparent)'
                      : 'color-mix(in srgb, var(--md-sys-color-surface-container-high) 60%, transparent)',
                  }}
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: 'color-mix(in srgb, var(--md-sys-color-surface-container-highest) 80%, transparent)' }}
                  >
                    <Upload
                      className="w-6 h-6 transition-colors"
                      style={{ color: dragOver ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface-variant)' }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-on-surface">
                      <span className="text-primary">Click to upload</span>
                      <span className="text-on-surface-variant/60"> or drag & drop</span>
                    </p>
                    <p className="text-xs text-on-surface-variant/40 mt-1">CSV files only</p>
                  </div>
                </div>
              ) : (
                <div
                  className="flex items-center gap-3 p-4 rounded-2xl border"
                  style={{
                    background: 'color-mix(in srgb, var(--md-sys-color-primary) 5%, transparent)',
                    borderColor: 'color-mix(in srgb, var(--md-sys-color-primary) 20%, transparent)',
                  }}
                >
                  <div
                    className="p-2.5 rounded-xl flex-shrink-0"
                    style={{ background: 'color-mix(in srgb, var(--md-sys-color-primary) 15%, transparent)' }}
                  >
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-on-surface truncate">{file.name}</p>
                    <p className="text-xs text-on-surface-variant/60 mt-0.5">
                      {(file.size / 1024).toFixed(1)} KB
                      <span
                        className="ml-2 font-medium"
                        style={{ color: 'var(--md-sys-color-primary)' }}
                      >
                        {data?.length || 0} rows detected
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={reset}
                    className="p-1.5 rounded-lg text-on-surface-variant/40 hover:text-error hover:bg-error/10 transition-all flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Preview table */}
            {data && data.length > 0 && (
              <div
                className="rounded-2xl overflow-hidden border"
                style={{ borderColor: 'color-mix(in srgb, var(--md-sys-color-outline) 12%, transparent)' }}
              >
                <div
                  className="px-4 py-2.5 flex items-center justify-between border-b"
                  style={{
                    background: 'var(--md-sys-color-surface-container-highest)',
                    borderColor: 'color-mix(in srgb, var(--md-sys-color-outline) 10%, transparent)',
                  }}
                >
                  <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Preview</span>
                  <span className="text-xs text-on-surface-variant/50">{data.length} total rows</span>
                </div>
                <div className="overflow-x-auto max-h-44 overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead style={{ background: 'var(--md-sys-color-surface-container-high)' }}>
                      <tr>
                        {Object.keys(data[0]).map(header => (
                          <th
                            key={header}
                            className="px-4 py-2.5 font-semibold capitalize whitespace-nowrap text-on-surface-variant"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.slice(0, 5).map((row, i) => (
                        <tr
                          key={i}
                          className="border-t transition-colors hover:bg-surface-container-high/50"
                          style={{ borderColor: 'color-mix(in srgb, var(--md-sys-color-outline) 6%, transparent)' }}
                        >
                          {Object.values(row).map((val, j) => (
                            <td key={j} className="px-4 py-2.5 text-on-surface-variant max-w-[140px] truncate">
                              {val || <span className="text-on-surface-variant/30 italic">—</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {data.length > 5 && (
                  <div
                    className="px-4 py-2 text-center text-xs text-on-surface-variant/40"
                    style={{ background: 'var(--md-sys-color-surface-container-high)' }}
                  >
                    + {data.length - 5} more rows not shown
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-on-surface-variant rounded-xl hover:bg-surface-container-highest transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={!file || loading}
                onClick={handleImport}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
                style={{
                  background: !file || loading
                    ? 'color-mix(in srgb, var(--md-sys-color-surface-container-highest) 80%, transparent)'
                    : 'var(--md-sys-color-primary)',
                  color: !file || loading
                    ? 'color-mix(in srgb, var(--md-sys-color-on-surface) 30%, transparent)'
                    : 'var(--md-sys-color-on-primary)',
                  cursor: !file || loading ? 'not-allowed' : 'pointer',
                  boxShadow: !file || loading ? 'none' : '0 4px 16px color-mix(in srgb, var(--md-sys-color-primary) 30%, transparent)',
                }}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>
                    Start Import
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          /* Results screen */
          <div className="py-4 space-y-6">
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: 'color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent)' }}
                >
                  <CheckCircle2 className="w-8 h-8 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-on-surface">Import Complete</h3>
                <p className="text-sm text-on-surface-variant/60 mt-0.5">Here's a summary of what happened</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div
                className="p-5 rounded-2xl text-center"
                style={{
                  background: 'color-mix(in srgb, var(--md-sys-color-primary) 8%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--md-sys-color-primary) 15%, transparent)',
                }}
              >
                <p className="text-3xl font-bold text-primary">{results.created ?? 0}</p>
                <p className="text-xs font-medium text-on-surface-variant mt-1 uppercase tracking-wide">Successful</p>
              </div>
              <div
                className="p-5 rounded-2xl text-center"
                style={{
                  background: 'color-mix(in srgb, var(--md-sys-color-error) 8%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--md-sys-color-error) 15%, transparent)',
                }}
              >
                <p className="text-3xl font-bold text-error">{results.failed ?? results.clashes?.length ?? 0}</p>
                <p className="text-xs font-medium text-on-surface-variant mt-1 uppercase tracking-wide">Failed</p>
              </div>
            </div>

            {/* Errors */}
            {results.errors?.length > 0 && (
              <div
                className="rounded-2xl overflow-hidden border"
                style={{
                  background: 'color-mix(in srgb, var(--md-sys-color-error) 5%, transparent)',
                  borderColor: 'color-mix(in srgb, var(--md-sys-color-error) 18%, transparent)',
                }}
              >
                <div
                  className="flex items-center gap-2 px-4 py-3 border-b"
                  style={{ borderColor: 'color-mix(in srgb, var(--md-sys-color-error) 15%, transparent)' }}
                >
                  <AlertCircle className="w-4 h-4 text-error flex-shrink-0" />
                  <span className="text-sm font-semibold text-error">
                    {results.errors.length} error{results.errors.length !== 1 ? 's' : ''} found
                  </span>
                </div>
                <ul className="max-h-36 overflow-y-auto divide-y" style={{ divideColor: 'color-mix(in srgb, var(--md-sys-color-error) 10%, transparent)' }}>
                  {results.errors.slice(0, 10).map((err, i) => (
                    <li key={i} className="px-4 py-2.5 text-xs text-error/80 flex items-start gap-2">
                      <span className="mt-0.5 flex-shrink-0 text-error/40">#{i + 1}</span>
                      {err.message || err.reason || 'Unknown error'}
                    </li>
                  ))}
                  {results.errors.length > 10 && (
                    <li className="px-4 py-2.5 text-xs text-error/50 italic text-center">
                      … and {results.errors.length - 10} more
                    </li>
                  )}
                </ul>
              </div>
            )}

            <button
              onClick={() => { reset(); onClose(); }}
              className="w-full py-3 rounded-2xl text-sm font-semibold transition-all active:scale-[0.98]"
              style={{
                background: 'var(--md-sys-color-primary)',
                color: 'var(--md-sys-color-on-primary)',
                boxShadow: '0 4px 16px color-mix(in srgb, var(--md-sys-color-primary) 25%, transparent)',
              }}
            >
              Done
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default BulkImportModal;