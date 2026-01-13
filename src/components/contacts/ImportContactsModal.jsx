import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

export default function ImportContactsModal({ isOpen, onClose, onImport, isLoading }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Please select a CSV file');
        setFile(null);
      }
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Extract data from CSV
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: 'object',
          properties: {
            contacts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  parent_name: { type: 'string' },
                  parent_email: { type: 'string' },
                  parent_phone: { type: 'string' },
                  athlete_name: { type: 'string' },
                  athlete_age: { type: 'number' },
                  sport_discipline: { type: 'string' },
                  notes: { type: 'string' }
                }
              }
            }
          }
        }
      });

      if (result.status === 'success' && result.output?.contacts) {
        onImport?.(result.output.contacts);
        setFile(null);
      } else {
        setError(result.details || 'Failed to parse CSV file');
      }
    } catch (err) {
      setError('Failed to import contacts. Please check your file format.');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
        >
          <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
            <h2 className="text-lg font-medium text-neutral-900">Import Contacts</h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-neutral-400" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center">
              {file ? (
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="font-medium text-neutral-900">{file.name}</p>
                  <p className="text-sm text-neutral-500">{(file.size / 1024).toFixed(1)} KB</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFile(null)}
                    className="text-neutral-500"
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6 text-neutral-400" />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900 mb-1">Upload CSV File</p>
                    <p className="text-sm text-neutral-500">
                      Drag and drop or click to browse
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label htmlFor="csv-upload">
                    <Button
                      as="span"
                      variant="outline"
                      className="cursor-pointer"
                    >
                      Select File
                    </Button>
                  </label>
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-700 font-medium mb-2">CSV Format:</p>
              <p className="text-xs text-blue-600 font-mono">
                parent_name, parent_email, parent_phone, athlete_name, athlete_age, sport_discipline, notes
              </p>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-neutral-100 flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={onClose} disabled={uploading || isLoading}>
              Cancel
            </Button>
            <Button 
              onClick={handleImport}
              disabled={!file || uploading || isLoading}
              className="bg-[#0066CC] hover:bg-[#0052A3] text-white"
            >
              {uploading || isLoading ? 'Importing...' : 'Import Contacts'}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}