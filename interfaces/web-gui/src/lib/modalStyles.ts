/**
 * Shared modal styles and utilities for consistent modal appearance
 * across the application. Uses CSS classes defined in globals.css.
 */
import React, { useEffect } from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MODAL_CLASSES = {
  // Base modal structure
  backdrop: "modal-backdrop",
  container: "modal-container",
  header: "modal-header",
  title: "modal-title",
  closeButton: "modal-close-button",
  downloadButton: "modal-download-button",
} as const;

/**
 * Standard modal event handlers
 */
export const createModalHandlers = (onClose: () => void) => ({
  handleKeyDown: (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  },

  handleBackdropClick: (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  },

  handleContainerClick: (event: React.MouseEvent) => {
    // Prevent modal from closing when clicking inside
    event.stopPropagation();
  },
});

/**
 * Modal lifecycle effects (keyboard handling, scroll lock)
 */
export const useModalEffects = (isOpen: boolean, onClose: () => void) => {
  const handlers = createModalHandlers(onClose);

  // Handle escape key and scroll lock
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handlers.handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handlers.handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handlers.handleKeyDown]);

  return handlers;
};

/**
 * Standard download handler for PDFs and other assets
 */
export const createDownloadHandler = (asset: { url: string; title: string; fileType: string }) => {
  return () => {
    const link = document.createElement('a');
    link.href = asset.url;
    link.download = `${asset.title}.${asset.fileType}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
};