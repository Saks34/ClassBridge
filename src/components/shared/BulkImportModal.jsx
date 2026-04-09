import React, { useState, useRef } from 'react';
import { Upload, Download, X, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
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
  const fileInputRef = useRef(null);
  const { user } = useAuth();

  const handleDownloadSample = async () => {
    try {
      let url = '';
      if (type === 'users') {
        url = `/institutions/bulk-staff/sample?role=${role}`;
      } else if (type === 'batches') {
        url = `/batches/sample`;
      } else if (type === 'timetable') {
        url = `/timetables/sample`;
      }

      const response = await api.get(url, {
        responseType: 'blob'
      });

      const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `${type}_sample.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
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
      headers.forEach((h, index) => {
        obj[h.toLowerCase().replace(/[^a-z]/g, '')] = values[index];
      });
      rows.push(obj);
    }
    return rows;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        const parsedData = parseCSV(event.target.result);
        setData(parsedData);
      };
      reader.readAsText(selectedFile);
    } else {
      toast.error('Please select a valid CSV file');
    }
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
          users: data.map(d => ({
            name: d.name,
            email: d.email,
            role: d.role || role
          })),
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
            day: d.day,
            startTime: d.starttime,
            endTime: d.endtime,
            subject: d.subject,
            batch: d.batchid,
            teacher: d.teacherid
          }))
        };
      }

      const response = await api.post(url, payload);

      setResults(response.data.data || response.data);
      if (onSuccess) onSuccess();
      toast.success('Import completed successfully');
    } catch (error) {
      console.error('Import error:', error);
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Bulk Import ${type}`} maxWidth="2xl">
      <div className="space-y-6">
        {!results ? (
          <>
            <div className="flex justify-between items-center p-4 bg-primary/10 rounded-xl border border-primary/20">
              <div className="flex gap-3">
                <div className="p-2 bg-primary/20 rounded-lg text-primary">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-on-surface">Step 1: Download Sample</h4>
                  <p className="text-sm text-on-surface-variant">Get the CSV template with the correct format</p>
                </div>
              </div>
              <button
                onClick={handleDownloadSample}
                className="flex items-center gap-2 px-4 py-2 bg-surface-container-high text-primary border border-outline-variant/10 rounded-lg hover:bg-primary/10 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                Download Sample
              </button>
            </div>

            <div 
              className={`p-8 border-2 border-dashed rounded-2xl text-center transition-colors ${
                file ? 'border-primary/50 bg-primary/5' : 'border-outline-variant/30 bg-surface-container-high'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv"
                className="hidden"
              />
              {!file ? (
                <div className="space-y-3">
                  <div className="flex justify-center">
                    <div className="p-4 bg-surface-container-highest rounded-full text-on-surface-variant/40">
                      <Upload className="w-8 h-8" />
                    </div>
                  </div>
                  <div>
                    <button
                      onClick={() => fileInputRef.current.click()}
                      className="text-primary font-semibold hover:underline"
                    >
                      Click to upload
                    </button>
                    <span className="text-on-surface-variant/60"> or drag and drop</span>
                    <p className="text-xs text-on-surface-variant/40 mt-1">Only CSV files are supported</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-surface-container-high p-4 rounded-xl border border-primary/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-on-surface">{file.name}</p>
                      <p className="text-xs text-on-surface-variant/60">{(file.size / 1024).toFixed(1)} KB • {data?.length || 0} rows found</p>
                    </div>
                  </div>
                  <button 
                    onClick={reset}
                    className="p-2 text-on-surface-variant/40 hover:text-error transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {data && data.length > 0 && (
              <div className="rounded-xl border border-outline-variant/10 overflow-hidden bg-surface-container-high">
                <div className="max-h-48 overflow-y-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-surface-container-highest border-b border-outline-variant/10 text-on-surface-variant font-bold">
                      <tr>
                        {Object.keys(data[0]).map(header => (
                          <th key={header} className="px-4 py-2 font-semibold capitalize">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/5">
                      {data.slice(0, 5).map((row, i) => (
                        <tr key={i} className="hover:bg-surface-bright/5">
                          {Object.values(row).map((val, j) => (
                            <td key={j} className="px-4 py-2 text-on-surface-variant max-w-[150px] truncate">{val}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {data.length > 5 && (
                    <div className="p-2 text-center text-xs text-on-surface-variant/40 bg-surface-container-highest/30">
                      + {data.length - 5} more rows
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={onClose}
                className="px-6 py-2.5 text-on-surface-variant font-medium hover:bg-surface-container-highest rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                disabled={!file || loading}
                onClick={handleImport}
                className={`px-6 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 ${
                  !file || loading
                    ? 'bg-surface-container-highest text-on-surface-variant/30 cursor-not-allowed'
                    : 'bg-primary text-on-primary hover:opacity-90 shadow-lg shadow-primary/20 active:scale-95'
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Start Import
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-8 space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-primary/10 rounded-full text-primary">
                <CheckCircle2 className="w-12 h-12" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-on-surface">Import Processed</h3>
              <p className="text-on-surface-variant/60 mt-1">Here's the summary of your import</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
              <div className="p-4 bg-surface-container-high rounded-2xl border border-outline-variant/10">
                <p className="text-2xl font-bold text-primary">{results.created || 0}</p>
                <p className="text-sm text-on-surface-variant">Successful</p>
              </div>
              <div className="p-4 bg-surface-container-high rounded-2xl border border-outline-variant/10">
                <p className="text-2xl font-bold text-error">{results.failed || results.clashes?.length || 0}</p>
                <p className="text-sm text-on-surface-variant">Failed/Skipped</p>
              </div>
            </div>

            {results.errors?.length > 0 && (
              <div className="mt-4 text-left max-h-40 overflow-y-auto p-4 bg-error/10 rounded-xl border border-error/20">
                <h4 className="flex items-center gap-2 text-error font-semibold text-sm mb-2">
                  <AlertCircle className="w-4 h-4" />
                  Error Details:
                </h4>
                <ul className="space-y-1">
                  {results.errors.slice(0, 10).map((err, i) => (
                    <li key={i} className="text-xs text-error/80">
                      • {err.message || err.reason || 'Unknown error'}
                    </li>
                  ))}
                  {results.errors.length > 10 && (
                    <li className="text-xs text-error/60 italic">... and {results.errors.length - 10} more</li>
                  )}
                </ul>
              </div>
            )}

            <button
              onClick={() => {
                reset();
                onClose();
              }}
              className="w-full mt-6 px-6 py-3 bg-secondary text-on-secondary-container font-semibold rounded-2xl hover:opacity-90 transition-all shadow-lg active:scale-[0.98]"
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
