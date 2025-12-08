"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useFileViewer } from "@/app/_providers/FileViewerProvider";
import { useShortcuts } from "@/app/_providers/ShortcutsProvider";
import Modal from "@/app/_components/GlobalComponents/Layout/Modal";
import IconButton from "@/app/_components/GlobalComponents/Buttons/IconButton";
import TextEditor, {
  type TextEditorHandle,
} from "../FileManipulation/TextEditor";
import PdfViewer from "../FileManipulation/PdfViewer";
import CsvViewer from "../FileManipulation/CsvViewer";
import {
  TEXT_EXTENSIONS,
  IMAGE_EXTENSIONS,
  VIDEO_EXTENSIONS,
  PDF_EXTENSIONS,
  CSV_EXTENSIONS,
  MARKDOWN_EXTENSIONS,
} from "@/app/_lib/constants";

export default function FileViewer() {
  const { isOpen, currentFile, closeViewer } = useFileViewer();
  const { registerActions, unregisterActions } = useShortcuts();
  const [isEditing, setIsEditing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const textEditorRef = useRef<TextEditorHandle>(null);

  const handleSave = useCallback(async () => {
    await textEditorRef.current?.save();
  }, []);

  const handleCancelEdit = useCallback(() => {
    textEditorRef.current?.cancel();
  }, []);

  const handleClose = () => {
    if (isDirty) {
      if (confirm("You have unsaved changes. Discard them?")) {
        closeViewer();
        setIsEditing(false);
        setIsDirty(false);
      }
    } else {
      closeViewer();
      setIsEditing(false);
      setIsDirty(false);
    }
  };

  useEffect(() => {
    if (isOpen && isEditing) {
      registerActions({
        onSave: handleSave,
      });
    } else {
      unregisterActions();
    }

    return () => unregisterActions();
  }, [isOpen, isEditing, handleSave, registerActions, unregisterActions]);

  if (!currentFile) return null;

  const extension = currentFile.name.split(".").pop()?.toLowerCase() || "";
  const isText = TEXT_EXTENSIONS.includes(extension);
  const isImage = IMAGE_EXTENSIONS.includes(extension);
  const isVideo = VIDEO_EXTENSIONS.includes(extension);
  const isPdf = PDF_EXTENSIONS.includes(extension);
  const isCsv = CSV_EXTENSIONS.includes(extension);
  const isMarkdown = MARKDOWN_EXTENSIONS.includes(extension);

  const viewUrl = `${currentFile.url}?view=true`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`${currentFile.name}${isDirty ? " *" : ""}`}
      size="xl"
      headerActions={
        <>
          {isText && !isEditing && (
            <IconButton icon="edit" onClick={() => setIsEditing(true)} />
          )}
          {isEditing && (
            <>
              <IconButton
                icon="save"
                onClick={handleSave}
                disabled={!isDirty || isSaving}
              />
              <IconButton icon="arrow_back" onClick={handleCancelEdit} />
            </>
          )}
          {!isEditing && (
            <a href={currentFile.url} download={currentFile.name}>
              <IconButton icon="download" />
            </a>
          )}
        </>
      }
    >
      <div className="p-6">
        {isText && (
          <TextEditor
            ref={textEditorRef}
            fileId={currentFile.id}
            fileName={currentFile.name}
            fileUrl={viewUrl}
            isEditing={isEditing}
            isMarkdown={isMarkdown}
            onEditingChange={setIsEditing}
            onDirtyChange={setIsDirty}
            onSavingChange={setIsSaving}
          />
        )}

        {isImage && (
          <div className="flex items-center justify-center">
            <img
              src={viewUrl}
              alt={currentFile.name}
              className="max-w-full max-h-[70vh] object-contain rounded"
            />
          </div>
        )}

        {isVideo && (
          <div className="flex items-center justify-center">
            <video
              src={viewUrl}
              controls
              className="max-w-full max-h-[70vh] rounded"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        )}

        {isPdf && <PdfViewer fileUrl={viewUrl} fileName={currentFile.name} />}

        {isCsv && <CsvViewer fileUrl={viewUrl} />}

        {!isText && !isImage && !isVideo && !isPdf && !isCsv && (
          <div className="flex items-center justify-center py-12">
            <div className="text-on-surface-variant">
              This file type cannot be previewed. Please download it to view.
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
