import { useState, useEffect, useRef } from "react";
import { api, resolveAssetUrl } from "../lib/api";
import { Plus, Pencil, Trash2, Eye, EyeOff, Upload, X, ArrowLeft, Image as ImageIcon, Crop } from "lucide-react";
import { ConfirmDialog, AlertDialog } from "../components/ConfirmDialog";
import { useLocation } from "wouter";
import { motion, AnimatePresence, Variants } from "framer-motion";

const EMPTY = {
  name: "",
  title: "",
  photoUrl: "",
  isVisible: true,
};

const easeInOut: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: easeInOut,
    },
  },
};

function resolveImageUrl(url) {
  return resolveAssetUrl(url);
}

/* ───────────────────────────── */
/* Image Crop Modal Component */
/* ───────────────────────────── */
function ImageCropModal({
  imageSrc,
  onCropSave,
  onCancel,
  saving,
}: {
  imageSrc: string;
  onCropSave: (croppedBlob: Blob, rawSrc: string) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [box, setBox] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [dragMode, setDragMode] = useState<'move' | 'nw' | 'ne' | 'sw' | 'se' | null>(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startBox, setStartBox] = useState({ x: 0, y: 0, width: 100, height: 100 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleStartDrag = (mode: 'move' | 'nw' | 'ne' | 'sw' | 'se', e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDragMode(mode);
    setStartPos({ x: e.clientX, y: e.clientY });
    setStartBox({ ...box });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragMode || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const dxPercent = ((e.clientX - startPos.x) / rect.width) * 100;
    const dyPercent = ((e.clientY - startPos.y) / rect.height) * 100;

    let { x, y, width, height } = startBox;

    if (dragMode === 'move') {
      x = Math.max(0, Math.min(100 - width, startBox.x + dxPercent));
      y = Math.max(0, Math.min(100 - height, startBox.y + dyPercent));
    } else if (dragMode === 'nw') {
      const newX = Math.max(0, Math.min(startBox.x + startBox.width - 10, startBox.x + dxPercent));
      const newY = Math.max(0, Math.min(startBox.y + startBox.height - 10, startBox.y + dyPercent));
      width = startBox.x + startBox.width - newX;
      height = startBox.y + startBox.height - newY;
      x = newX;
      y = newY;
    } else if (dragMode === 'ne') {
      const newWidth = Math.max(10, Math.min(100 - startBox.x, startBox.width + dxPercent));
      const newY = Math.max(0, Math.min(startBox.y + startBox.height - 10, startBox.y + dyPercent));
      height = startBox.y + startBox.height - newY;
      width = newWidth;
      y = newY;
    } else if (dragMode === 'sw') {
      const newX = Math.max(0, Math.min(startBox.x + startBox.width - 10, startBox.x + dxPercent));
      const newHeight = Math.max(10, Math.min(100 - startBox.y, startBox.height + dyPercent));
      width = startBox.x + startBox.width - newX;
      height = newHeight;
      x = newX;
    } else if (dragMode === 'se') {
      width = Math.max(10, Math.min(100 - startBox.x, startBox.width + dxPercent));
      height = Math.max(10, Math.min(100 - startBox.y, startBox.height + dyPercent));
    }

    setBox({ x, y, width, height });
  };

  const handleMouseUp = () => {
    setDragMode(null);
  };

  const handleApplyCrop = () => {
    const img = imgRef.current;
    if (!img) return;

    const naturalW = img.naturalWidth || 1920;
    const naturalH = img.naturalHeight || 1080;

    const sx = (box.x / 100) * naturalW;
    const sy = (box.y / 100) * naturalH;
    const sw = (box.width / 100) * naturalW;
    const sh = (box.height / 100) * naturalH;

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(100, Math.round(sw));
    canvas.height = Math.max(100, Math.round(sh));
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    try {
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          onCropSave(blob, imageSrc);
        }
      }, "image/jpeg", 0.98);
    } catch (err) {
      console.error(err);
      alert("Failed to crop image. Please try uploading the image again.");
    }
  };


  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 rounded-xl text-[#0D4A7A]">
              <Crop size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0D4A7A]">Crop Team Image</h3>
              <p className="text-xs text-gray-500">Full image shown — drag corner handles to crop, then click Apply Crop</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={saving}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-200/60 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Viewport */}
        <div className="p-6 flex flex-col items-center justify-center bg-slate-950/90 overflow-auto relative select-none">
          <div
            ref={containerRef}
            className="relative inline-block border border-slate-700 shadow-2xl rounded-lg overflow-hidden select-none bg-black"
          >
            <img
              ref={imgRef}
              src={imageSrc}
              crossOrigin="anonymous"
              alt="Original target"
              draggable={false}
              className="max-h-[60vh] max-w-full block object-contain select-none pointer-events-none"
            />

            {/* Interactive Resizable Crop Box */}
            <div
              onMouseDown={(e) => handleStartDrag('move', e)}
              className="absolute border-2 border-blue-400 bg-blue-500/10 cursor-move shadow-2xl flex items-center justify-center"
              style={{
                left: `${box.x}%`,
                top: `${box.y}%`,
                width: `${box.width}%`,
                height: `${box.height}%`,
              }}
            >
              {/* Grid Lines */}
              <div className="w-full h-full border border-white/40 grid grid-cols-3 grid-rows-3 pointer-events-none">
                <div className="border-r border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-b border-white/20" />
                <div className="border-r border-white/20" />
                <div className="border-r border-white/20" />
                <div />
              </div>

              {/* Corner Resize Handles */}
              <div
                onMouseDown={(e) => handleStartDrag('nw', e)}
                className="absolute -top-2 -left-2 w-4 h-4 bg-white border-2 border-blue-600 rounded-sm cursor-nwse-resize shadow-md hover:scale-125 transition-transform"
              />
              <div
                onMouseDown={(e) => handleStartDrag('ne', e)}
                className="absolute -top-2 -right-2 w-4 h-4 bg-white border-2 border-blue-600 rounded-sm cursor-nesw-resize shadow-md hover:scale-125 transition-transform"
              />
              <div
                onMouseDown={(e) => handleStartDrag('sw', e)}
                className="absolute -bottom-2 -left-2 w-4 h-4 bg-white border-2 border-blue-600 rounded-sm cursor-nesw-resize shadow-md hover:scale-125 transition-transform"
              />
              <div
                onMouseDown={(e) => handleStartDrag('se', e)}
                className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-blue-600 rounded-sm cursor-nwse-resize shadow-md hover:scale-125 transition-transform"
              />
            </div>
          </div>
          <span className="text-xs text-blue-200/80 mt-3 font-medium flex items-center gap-1.5">
            📐 Drag white corner handles to resize crop area. Drag inside box to move selection.
          </span>
        </div>

        {/* Controls */}
        <div className="p-5 bg-white border-t border-gray-100 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setBox({ x: 0, y: 0, width: 100, height: 100 })}
            className="px-3.5 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl border border-gray-200 cursor-pointer"
          >
            Reset to Full
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApplyCrop}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-[#0D4A7A] hover:bg-[#0A3B61] text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  Apply
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Modal({ member, onSave, onClose }) {
  const [form, setForm] = useState(member || EMPTY);
  const [rawPhotoUrl, setRawPhotoUrl] = useState<string>(member?.rawPhotoUrl || member?.photoUrl || "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [titleError, setTitleError] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(member?.photoUrl ? resolveImageUrl(member.photoUrl) : "");
  const [memberCropOpen, setMemberCropOpen] = useState(false);
  const [memberCropSrc, setMemberCropSrc] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setUploadError("File size should be less than 8MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setUploadError("Please upload an image file");
      return;
    }

    setUploadError(null);

    const reader = new FileReader();
    reader.onload = () => {
      setMemberCropSrc(reader.result as string);
      setMemberCropOpen(true);
    };
    reader.readAsDataURL(file);
    if (e.target) e.target.value = "";
  };

  const handleCropExisting = () => {
    const targetUrl = rawPhotoUrl || form.photoUrl || previewUrl;
    if (!targetUrl) return;
    setMemberCropSrc(resolveImageUrl(targetUrl));
    setMemberCropOpen(true);
  };

  const handleCroppedSaveMember = async (croppedBlob: Blob, rawSrc: string) => {
    setUploading(true);
    setUploadError(null);
    try {
      const reader = new FileReader();
      const base64Url = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(croppedBlob);
      });

      const uploadedCroppedUrl = base64Url;
      const finalRawUrl = rawSrc;

      set("photoUrl", uploadedCroppedUrl);
      setForm((prev) => ({ ...prev, photoUrl: uploadedCroppedUrl, rawPhotoUrl: finalRawUrl }));
      setRawPhotoUrl(finalRawUrl);
      setPreviewUrl(uploadedCroppedUrl);

      setMemberCropOpen(false);
      setMemberCropSrc(null);
    } catch (err: any) {
      setUploadError(err.message || "Failed to save cropped photo");
    } finally {
      setUploading(false);
    }
  };

  async function save() {
    if (uploading || saving) return;

    let hasError = false;
    if (!form.name?.trim()) {
      setNameError(true);
      hasError = true;
    } else {
      setNameError(false);
    }

    if (!form.title?.trim()) {
      setTitleError(true);
      hasError = true;
    } else {
      setTitleError(false);
    }

    if (hasError) return;

    setSaveError(null);
    setSaving(true);

    try {
      await onSave({
        id: form.id,
        name: form.name.trim(),
        title: form.title.trim(),
        photoUrl: form.photoUrl,
        rawPhotoUrl: rawPhotoUrl || form.photoUrl,
        isVisible: form.isVisible,
      });
    } catch (err: any) {
      setSaveError(err.message || "Saving team member failed. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 bg-white transition-all";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-2";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden relative"
        >
          {/* Header */}
          <div className="sticky top-0 bg-[#0D4A7A] px-6 py-5 flex justify-between items-center z-10">
            <div>
              <h3 className="text-2xl font-bold text-white">
                {member?.id ? "Edit Member" : "Add Member"}
              </h3>
              <p className="text-blue-100 text-sm mt-1">Fill in the details below</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-200 transition-colors p-2 hover:bg-white/10 rounded-full"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
            {saveError && (
              <div className="p-3.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                {saveError}
              </div>
            )}

            {/* Image Upload Section */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Profile Image</label>
              <div className="flex items-center gap-5">
                {/* Image Preview */}
                <div className="shrink-0">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-blue-200 flex items-center justify-center">
                    {previewUrl || form.photoUrl ? (
                      <img
                        src={previewUrl || resolveImageUrl(form.photoUrl)}
                        className="w-full h-full object-cover"
                        alt="Preview"
                      />
                    ) : (
                      <ImageIcon size={32} className="text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Upload Controls */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="cursor-pointer">
                      <div className="px-4 py-2 bg-[#0D4A7A] hover:bg-[#0A3B61] text-white rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2">
                        <Upload size={16} />
                        {form.photoUrl || previewUrl ? "Change Image" : "Upload Image"}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        ref={fileRef}
                      />
                    </label>

                    {(form.photoUrl || previewUrl) && (
                      <>
                        <button
                          type="button"
                          onClick={handleCropExisting}
                          disabled={uploading}
                          className="px-4 py-2 bg-[#0D4A7A] hover:bg-[#0A3B61] text-white rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Crop size={16} />
                          Crop Image
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            set("photoUrl", "");
                            setPreviewUrl("");
                          }}
                          className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                        >
                          Remove
                        </button>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Upload a profile image (Max 8MB, JPG/PNG)</p>
                  {uploading && (
                    <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                      <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      Processing image...
                    </div>
                  )}
                  {uploadError && <p className="text-xs text-red-500 mt-1">{uploadError}</p>}
                </div>
              </div>
            </div>

            {/* Image Path Field */}
            <div>
              <label className={labelClass}>Image Path / URL</label>
              <input
                className={inputClass}
                value={form.photoUrl}
                onChange={(e) => set("photoUrl", e.target.value)}
                placeholder="Enter image URL or upload above"
              />
              <p className="text-xs text-gray-400 mt-1">You can either upload an image or paste a URL directly</p>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Full Name <span className="text-red-500">*</span></label>
                <input
                  className={`${inputClass} ${nameError ? 'border-red-500 ring-2 ring-red-100 bg-red-50/20' : ''}`}
                  value={form.name}
                  onChange={(e) => {
                    set("name", e.target.value);
                    if (nameError && e.target.value.trim()) setNameError(false);
                  }}
                  placeholder="Enter full name"
                />
                {nameError && (
                  <p className="text-xs text-red-500 mt-1 font-medium">Please enter full name</p>
                )}
              </div>
              <div>
                <label className={labelClass}>Title <span className="text-red-500">*</span></label>
                <input
                  className={`${inputClass} ${titleError ? 'border-red-500 ring-2 ring-red-100 bg-red-50/20' : ''}`}
                  value={form.title}
                  onChange={(e) => {
                    set("title", e.target.value);
                    if (titleError && e.target.value.trim()) setTitleError(false);
                  }}
                  placeholder="e.g., Senior Counsellor"
                />
                {titleError && (
                  <p className="text-xs text-red-500 mt-1 font-medium">Please enter title</p>
                )}
              </div>
            </div>

            {/* Visibility toggle */}
            <div className="flex items-center gap-3 bg-blue-50 px-4 py-3 rounded-lg border border-blue-200">
              <input
                type="checkbox"
                id="visibleCb"
                checked={form.isVisible}
                onChange={(e) => set("isVisible", e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="visibleCb" className="text-sm font-medium text-gray-700 cursor-pointer">
                 Visible on public website
              </label>
            </div>
          </div>

          {/* Footer with Blue Save Button */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving || uploading}
              className="px-6 py-2.5 rounded-xl bg-[#0D4A7A] hover:bg-[#0A3B61] text-white font-semibold text-sm shadow-md disabled:opacity-50 cursor-pointer"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>

          {memberCropOpen && memberCropSrc && (
            <ImageCropModal
              imageSrc={memberCropSrc}
              onCropSave={handleCroppedSaveMember}
              onCancel={() => {
                setMemberCropOpen(false);
                setMemberCropSrc(null);
              }}
              saving={uploading}
            />
          )}
        </motion.div>
      </div>

      <AlertDialog
        open={!!uploadError}
        title="Upload Failed"
        message={uploadError || ""}
        onClose={() => setUploadError(null)}
      />
      <AlertDialog
        open={!!saveError}
        title="Save Failed"
        message={saveError || ""}
        onClose={() => setSaveError(null)}
      />
    </AnimatePresence>
  );
}

// ─── View Detail Modal ────────────────────────────────────────────────────────
function ViewModal({ member, onClose }: { member: any; onClose: () => void }) {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden"
          style={{ height: "85vh" }}
        >
          {/* Header */}
          <div className="bg-[#0D4A7A] px-6 py-5 flex justify-between items-start shrink-0">
            <div>
              <h3 className="text-xl font-bold text-white">Preview</h3>
              <p className="text-blue-200 text-sm mt-0.5">View complete member information</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-200 transition-colors p-1 hover:bg-white/10 rounded-full mt-0.5"
            >
              <X size={20} />
            </button>
          </div>

          {/* Scrollable body */}
          {/* Large photo — fixed at top, outside scroll */}
          {member.photoUrl ? (
            <div className="w-full shrink-0 bg-gray-100 flex items-center justify-center" style={{ height: 260 }}>
              <img
                src={resolveImageUrl(member.photoUrl)}
                alt={member.name}
                className="h-full w-full object-contain"
              />
            </div>
          ) : (
            <div className="w-full shrink-0 flex items-center justify-center bg-blue-50" style={{ height: 200 }}>
              <span className="text-blue-300 text-6xl font-bold">{member.name?.charAt(0)}</span>
            </div>
          )}

          <div className="flex-1 overflow-y-auto min-h-0 px-6 py-6 space-y-5">
            {/* Name */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Name</p>
              <p className="text-lg font-bold text-gray-900">{member.name}</p>
            </div>

            {/* Title */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Title</p>
              <p className="text-base text-gray-800">{member.title || "—"}</p>
            </div>

            {/* Visibility */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Visibility</p>
              <span
                className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${
                  member.isVisible
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {member.isVisible ? "Visible" : "Hidden"}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function TeamAdmin() {
  const [members, setMembers] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [viewMember, setViewMember] = useState<any>(null);
  const [, navigate] = useLocation();

  const [groupPhotoUrl, setGroupPhotoUrl] = useState<string>(() => {
    return localStorage.getItem("wings_team_group_photo") || "";
  });
  const [rawGroupPhotoUrl, setRawGroupPhotoUrl] = useState<string>(() => {
    return localStorage.getItem("wings_team_raw_group_photo") || "";
  });
  const [groupPhotoUploading, setGroupPhotoUploading] = useState<boolean>(false);
  const [cropModalOpen, setCropModalOpen] = useState<boolean>(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [confirmRemovePhotoOpen, setConfirmRemovePhotoOpen] = useState<boolean>(false);
  const groupFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    load();
    loadGroupPhoto();
  }, []);

  async function loadGroupPhoto() {
    try {
      const data = await api.getTeamGroupPhoto();
      if (data?.photoUrl) {
        setGroupPhotoUrl(data.photoUrl);
        setRawGroupPhotoUrl(data.rawPhotoUrl || data.photoUrl);
        localStorage.setItem("wings_team_group_photo", data.photoUrl);
        localStorage.setItem("wings_team_raw_group_photo", data.rawPhotoUrl || data.photoUrl);
      } else {
        setGroupPhotoUrl("");
        setRawGroupPhotoUrl("");
        localStorage.removeItem("wings_team_group_photo");
        localStorage.removeItem("wings_team_raw_group_photo");
      }
    } catch (err) {
      console.error(err);
    }
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    if (e.target) e.target.value = "";
  }

  function handleCropExistingPhoto() {
    const targetUrl = rawGroupPhotoUrl || groupPhotoUrl;
    if (!targetUrl) return;
    setCropImageSrc(resolveImageUrl(targetUrl));
    setCropModalOpen(true);
  }

  async function handleCroppedSave(croppedBlob: Blob, rawSrc: string) {
    setGroupPhotoUploading(true);
    try {
      const reader = new FileReader();
      const base64Url = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(croppedBlob);
      });

      const uploadedCroppedUrl = base64Url;
      const finalRawUrl = rawSrc;

      await api.updateTeamGroupPhoto(uploadedCroppedUrl, finalRawUrl);
      setGroupPhotoUrl(uploadedCroppedUrl);
      setRawGroupPhotoUrl(finalRawUrl);
      localStorage.setItem("wings_team_group_photo", uploadedCroppedUrl);
      localStorage.setItem("wings_team_raw_group_photo", finalRawUrl);

      setCropModalOpen(false);
      setCropImageSrc(null);
    } catch (err: any) {
      alert(err.message || "Failed to save cropped photo");
    } finally {
      setGroupPhotoUploading(false);
    }
  }

  function handleGroupPhotoRemoveClick() {
    setConfirmRemovePhotoOpen(true);
  }

  async function handleGroupPhotoRemoveConfirm() {
    setGroupPhotoUploading(true);
    try {
      await api.deleteTeamGroupPhoto();
      setGroupPhotoUrl("");
      setRawGroupPhotoUrl("");
      localStorage.removeItem("wings_team_group_photo");
      localStorage.removeItem("wings_team_raw_group_photo");
    } catch (err: any) {
      alert(err.message || "Failed to remove team image");
    } finally {
      setGroupPhotoUploading(false);
      setConfirmRemovePhotoOpen(false);
    }
  }

  async function load() {
    setLoading(true);
    try {
      const data = await api.getTeam();
      setMembers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function save(member) {
    if (member.id) {
      await api.updateTeam(member.id, member);
    } else {
      await api.createTeam(member);
    }
    setEditing(null);
    await load();
  }

  async function remove() {
    await api.deleteTeam(deleteTarget);
    setDeleteTarget(null);
    await load();
  }

  async function toggle(m) {
    await api.updateTeam(m.id, { ...m, isVisible: !m.isVisible });
    await load();
  }

  const handleBack = () => {
    navigate("/admin");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen w-full bg-gray-50">
        <div className="w-full px-6 py-8">
          {/* HEADER WITH BACK BUTTON */}
          <div className="flex items-center gap-3 mb-8 pb-2">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
              title="Go Back"
            >
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M15 18L9 12L15 6"
                  stroke="#0D4A7A"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-[#0D4A7A] mb-1">Team Management</h1>
            </div>
          </div>
          
          {/* TEAM GROUP PHOTO SECTION */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-[#0D4A7A]">Team Group Image</h2>
                <p className="text-gray-500 text-sm mt-0.5">
                  Upload or update the team image displayed in the Hero section of the Team Page.
                </p>
              </div>
              {/* <span className={`text-xs px-3.5 py-1.5 rounded-full font-medium inline-flex items-center gap-1.5 w-fit ${groupPhotoUrl ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                <span className={`w-2 h-2 rounded-full ${groupPhotoUrl ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                {groupPhotoUrl ? 'Custom Image Active' : 'No Photo Uploaded'}
              </span> */}
            </div>

            <div className="flex flex-col lg:flex-row items-stretch gap-6">
              {/* Preview Image */}
              <div className="relative w-full lg:w-[480px] xl:w-[540px] shrink-0 h-60 sm:h-72 rounded-xl overflow-hidden bg-slate-900 border border-gray-200 shadow-md group">
                {groupPhotoUrl ? (
                  <img
                    src={resolveImageUrl(groupPhotoUrl)}
                    alt="Team Group Image"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full border-2 border-dashed border-gray-300 rounded-xl bg-slate-50 flex flex-col items-center justify-center text-center p-6">
                    <ImageIcon size={44} className="text-gray-300 mb-2" />
                    <span className="text-gray-600 font-semibold text-sm">No Team Image Uploaded</span>
                    <span className="text-gray-400 text-xs mt-1">Click "Upload Team Image" below to set the Team Page hero image</span>
                  </div>
                )}
                {groupPhotoUploading && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center text-white text-sm font-medium gap-2.5">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Updating image...
                  </div>
                )}
              </div>

              {/* Controls and Information Panel */}
              <div className="flex flex-col justify-between flex-1 w-full gap-4">
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
                    <div className="text-xs font-semibold tracking-wider text-gray-900">Current image</div>
                    <div className="text-sm font-medium text-gray-700">
                      {groupPhotoUrl ? (
                        <span className="text-emerald-700 font-semibold">Uploaded team image displayed on the Team page.</span>
                      ) : (
                        <span className="text-gray-500 font-normal">No Team Image Uploaded.</span>
                      )}
                    </div>
                  </div>

                  <input
                    type="file"
                    ref={groupFileInputRef}
                    onChange={handleFileSelected}
                    accept="image/*"
                    className="hidden"
                  />

                  <div className="flex flex-wrap items-center gap-3">
                    {!groupPhotoUrl ? (
                      <button
                        type="button"
                        disabled={groupPhotoUploading}
                        onClick={() => groupFileInputRef.current?.click()}
                        className="px-5 py-2.5 bg-[#0D4A7A] hover:bg-[#0A3B61] text-white font-semibold text-sm rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                      >
                        <Upload size={18} />
                        Upload Team Image
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          disabled={groupPhotoUploading}
                          onClick={handleCropExistingPhoto}
                          className="px-5 py-2.5 bg-[#0D4A7A] hover:bg-[#0A3B61] text-white font-semibold text-sm rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                        >
                          <Crop size={18} />
                          Crop Image
                        </button>
                        <button
                          type="button"
                          disabled={groupPhotoUploading}
                          onClick={() => groupFileInputRef.current?.click()}
                          className="px-5 py-2.5 bg-[#0D4A7A] hover:bg-[#0A3B61] text-white font-semibold text-sm rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                        >
                          <Upload size={18} />
                          Replace Image
                        </button>
                        <button
                          type="button"
                          disabled={groupPhotoUploading}
                          onClick={handleGroupPhotoRemoveClick}
                          className="px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-sm rounded-xl transition-all border border-red-200 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                        >
                          <Trash2 size={18} />
                          Remove
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3.5 text-xs text-blue-900 flex items-start gap-2.5">
                  <ImageIcon size={18} className="text-[#0D4A7A] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-[#0D4A7A] mb-0.5">Image Guidelines</span>
                    Recommended resolution: 1920 × 1080 (16:9 ratio). Supported file formats: JPG, PNG, WEBP. Maximum allowed file size: 8MB.
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* TABLE VIEW */}
          <motion.div
            initial="hidden"
            animate="show"
            variants={containerVariants}
            className="bg-white rounded-xl shadow-lg overflow-hidden w-full"
          >
            {/* Table Header Bar with Add Member Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white border-b border-gray-100">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-[#0D4A7A]">Team Members</h2>
                <span className="px-3 py-1 bg-blue-50 text-[#0D4A7A] text-xs font-semibold rounded-full border border-blue-100">
                  {members.length} {members.length === 1 ? 'member' : 'members'}
                </span>
              </div>
              <button
                onClick={() => setEditing(EMPTY)}
                className="px-5 py-2.5 bg-[#0D4A7A] hover:bg-[#0A3B61] text-white font-semibold text-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 w-fit cursor-pointer"
              >
                <Plus size={18} />
                Add Member
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#eef2ff] border-b-2 border-blue-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">#</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Image</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Title</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Visible</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-blue-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {members.length > 0 ? (
                    members.map((member, index) => (
                      <motion.tr
                        key={member.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => setSelectedId(selectedId === member.id ? null : member.id)}
                        className={`cursor-pointer transition-all duration-200 ${selectedId === member.id ? "bg-blue-100" : "hover:bg-blue-50"
                          }`}
                      >
                        <td className="px-6 py-4 text-sm font-medium text-blue-600">{index + 1}</td>
                        <td className="px-6 py-4">
                          {member.photoUrl ? (
                            <img
                              src={resolveImageUrl(member.photoUrl)}
                              alt={member.name}
                              className="w-12 h-12 rounded-full object-cover border-2 border-blue-200"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-blue-100 border-2 border-blue-200 flex items-center justify-center">
                              <span className="text-blue-600 text-sm font-bold">{member.name?.charAt(0)}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className=" text-gray-900">{member.name}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-sm">{member.title}</td>
                        <td className="px-6 py-4 text-left">
                          <span className={`text-sm font-medium ${member.isVisible ? "text-green-600" : "text-gray-400"}`}>
                            {member.isVisible ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); setViewMember(member); }}
                              className="p-2 rounded-lg text-gray-500 transition-all duration-200"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditing(member); }}
                              className="p-2 rounded-lg text-gray-500  transition-all duration-200"
                              title="Edit"
                            >
                              <Pencil size="16" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeleteTarget(member.id); }}
                              className="p-2 rounded-lg text-gray-500  transition-all duration-200"
                              title="Delete"
                            >
                              <Trash2 size="16" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <ImageIcon size={48} className="text-gray-300" />
                          <p className="text-gray-500 text-lg">No team members found</p>
                          <p className="text-gray-400 text-sm">Click "Add Member" to create your first team member!</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>

      {editing && <Modal member={editing} onSave={save} onClose={() => setEditing(null)} />}

      {viewMember && <ViewModal member={viewMember} onClose={() => setViewMember(null)} />}

      {cropModalOpen && cropImageSrc && (
        <ImageCropModal
          imageSrc={cropImageSrc}
          onCropSave={handleCroppedSave}
          onCancel={() => { setCropModalOpen(false); setCropImageSrc(null); }}
          saving={groupPhotoUploading}
        />
      )}

      <ConfirmDialog
        open={confirmRemovePhotoOpen}
        title="Remove Team Image"
        message="Are you sure you want to remove the team image?"
        confirmLabel="Remove"
        confirmColor="#ef4444"
        loading={groupPhotoUploading}
        onConfirm={handleGroupPhotoRemoveConfirm}
        onCancel={() => setConfirmRemovePhotoOpen(false)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Member"
        message="Are you sure you want to delete this team member?"
        onConfirm={remove}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}