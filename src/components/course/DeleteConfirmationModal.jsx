
import React from 'react';
import { Button } from '../ui/button';
import { AlertTriangle } from 'lucide-react';

const DeleteConfirmationModal = ({ 
  isOpen, 
  onConfirm, 
  onCancel, 
  fileName 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="confirmation-modal">
        <div className="modal-content">
          <h2 className="modal-title">
            <AlertTriangle size={20} className="inline-block mr-2" />
            Delete File
          </h2>
          <p className="modal-message">
            Are you sure you want to delete this file?
            <br />
            <span className="text-sm font-medium text-gray-900 break-all mt-2 block">
              {fileName}
            </span>
          </p>
          <div className="modal-buttons">
            <Button 
              className="secondary-button"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button 
              className="danger-button"
              onClick={onConfirm}
            >
              Delete File
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;