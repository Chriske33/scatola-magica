"use client";

import { useState, useEffect } from "react";
import Modal from "@/app/_components/GlobalComponents/Layout/Modal";
import Button from "@/app/_components/GlobalComponents/Buttons/Button";
import Icon from "@/app/_components/GlobalComponents/Icons/Icon";
import { getKeyStatus } from "@/app/_server/actions/pgp";

interface UploadEncryptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (useOwnKey: boolean, customPublicKey?: string) => void;
}

export default function UploadEncryptionModal({
  isOpen,
  onClose,
  onConfirm,
}: UploadEncryptionModalProps) {
  const [useOwnKey, setUseOwnKey] = useState(true);
  const [customPublicKey, setCustomPublicKey] = useState("");
  const [hasOwnKeys, setHasOwnKeys] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      getKeyStatus().then((status) => {
        setHasOwnKeys(status.hasKeys);
        if (!status.hasKeys) {
          setUseOwnKey(false);
        }
      });
    }
  }, [isOpen]);

  function handleConfirm() {
    if (!useOwnKey && !customPublicKey.trim()) {
      setError("Please provide a custom public key");
      return;
    }

    onConfirm(useOwnKey, useOwnKey ? undefined : customPublicKey);
    handleClose();
  }

  function handleClose() {
    setUseOwnKey(true);
    setCustomPublicKey("");
    setError("");
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Upload Encrypted Files"
      size="md"
    >
      <div className="p-6 space-y-4">
        {error && (
          <div className="p-4 bg-error-container text-on-error-container rounded-lg flex items-center gap-2">
            <Icon icon="error" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <p className="text-sm text-on-surface-variant mb-4">
            Files will be encrypted on your device before uploading, ensuring
            end-to-end encryption.
          </p>
        </div>

        <div className="space-y-3">
          {hasOwnKeys && (
            <div
              className="flex items-start gap-3 p-4 bg-surface-container rounded-lg cursor-pointer hover:bg-surface-container-high transition-colors"
              onClick={() => setUseOwnKey(true)}
            >
              <input
                type="radio"
                id="own-key-upload"
                checked={useOwnKey}
                onChange={() => setUseOwnKey(true)}
                className="w-4 h-4 mt-0.5"
              />
              <div className="flex-1">
                <label
                  htmlFor="own-key-upload"
                  className="text-on-surface font-medium cursor-pointer block"
                >
                  Use my public key
                </label>
                <p className="text-xs text-on-surface-variant mt-1">
                  Encrypt files with your PGP public key. Only you can decrypt
                  them.
                </p>
              </div>
            </div>
          )}

          <div
            className="flex items-start gap-3 p-4 bg-surface-container rounded-lg cursor-pointer hover:bg-surface-container-high transition-colors"
            onClick={() => setUseOwnKey(false)}
          >
            <input
              type="radio"
              id="custom-key-upload"
              checked={!useOwnKey}
              onChange={() => setUseOwnKey(false)}
              className="w-4 h-4 mt-0.5"
            />
            <div className="flex-1">
              <label
                htmlFor="custom-key-upload"
                className="text-on-surface font-medium cursor-pointer block"
              >
                Use a custom public key
              </label>
              <p className="text-xs text-on-surface-variant mt-1">
                Encrypt for someone else by providing their public key.
              </p>
            </div>
          </div>
        </div>

        {!useOwnKey && (
          <div>
            <label className="block text-sm font-medium text-on-surface mb-2">
              Public Key (ASCII Armored)
            </label>
            <textarea
              value={customPublicKey}
              onChange={(e) => {
                setCustomPublicKey(e.target.value);
                setError("");
              }}
              rows={8}
              placeholder="-----BEGIN PGP PUBLIC KEY BLOCK-----"
              className="w-full px-2.5 py-1.5 text-sm rounded-lg bg-surface-container text-on-surface focus:outline-none font-mono"
            />
          </div>
        )}

        {!hasOwnKeys && (
          <div className="p-4 bg-warning-container text-on-warning-container rounded-lg flex gap-3">
            <Icon icon="info" className="flex-shrink-0" />
            <p className="text-sm">
              You don't have PGP keys. Generate them in Settings or provide a
              custom public key.
            </p>
          </div>
        )}

        <div className="p-4 bg-info-container text-on-info-container rounded-lg flex gap-3">
          <Icon icon="info" className="flex-shrink-0" />
          <p className="text-sm">
            Files are encrypted in your browser before upload. The server never
            sees unencrypted data.
          </p>
        </div>

        <div className="pt-2 flex gap-3 justify-end">
          <Button variant="outlined" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="filled"
            onClick={handleConfirm}
            disabled={!useOwnKey && !customPublicKey.trim()}
          >
            <Icon icon="upload" size="sm" />
            Continue to Upload
          </Button>
        </div>
      </div>
    </Modal>
  );
}
