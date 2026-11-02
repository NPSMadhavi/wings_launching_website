import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Trash2,
  Pencil,
  Search,
  Check,
  LayoutDashboard,
  FileText,
  Briefcase,
  Calendar,
  HeartHandshake,
  Handshake,
  MessageSquareQuote,
  Share2,
  CheckCircle2,
  XCircle,
  Sparkles,
  RefreshCw,
  UserCheck,
  ArrowLeft,
} from "lucide-react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { toast } from "react-toastify";
import SEO from "@/components/SEO";

// Available system sections definition with exact matching sidebar icons
export const MODULE_SECTIONS = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    color: "#004689",
  },
  {
    key: "team",
    label: "Team Members",
    icon: Users,
    color: "#2563eb",
  },
  {
    key: "articles",
    label: "Articles",
    icon: FileText,
    color: "#0284c7",
  },
  {
    key: "careers",
    label: "Careers",
    icon: Briefcase,
    color: "#0d9488",
  },
  {
    key: "events",
    label: "Events",
    icon: Calendar,
    color: "#16a34a",
  },
  {
    key: "services",
    label: "Services",
    icon: Briefcase,
    color: "#ca8a04",
  },
  {
    key: "appointments",
    label: "Appointments",
    icon: Calendar,
    color: "#ea580c",
  },
  {
    key: "volunteers",
    label: "Volunteers",
    icon: HeartHandshake,
    color: "#e11d48",
  },
  {
    key: "partners",
    label: "Partners",
    icon: Handshake,
    color: "#9333ea",
  },
  {
    key: "testimonials",
    label: "Testimonials",
    icon: MessageSquareQuote,
    color: "#4f46e5",
  },
  {
    key: "social-media",
    label: "Social Media Links",
    icon: Share2,
    color: "#0891b2",
  },
  {
    key: "visitors",
    label: "Visitors",
    icon: Users, // Exactly matches sidebar Visitors icon
    color: "#059669",
  },
  {
    key: "mails",
    label: "Settings / Mails",
    icon: Mail,
    color: "#475569",
  },
];

const PREDEFINED_ROLES = [
  "Counsellor",
  "Senior Counsellor",
  "Admin Executive",
];

// Recommended module presets for roles
const ROLE_DEFAULT_SECTIONS: Record<string, string[]> = {
  Counsellor: ["dashboard", "appointments", "services"],
  "Senior Counsellor": [
    "dashboard",
    "appointments",
    "services",
    "team",
    "testimonials",
  ],
  "Admin Executive": [
    "dashboard",
    "team",
    "articles",
    "careers",
    "events",
    "services",
    "appointments",
    "volunteers",
    "partners",
    "testimonials",
    "social-media",
    "visitors",
    "mails",
  ],
};

interface SystemUser {
  id: number;
  email: string;
  role: string;
  sections: string[];
  isActive: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
  lastLoginAt?: string | null;
  isSystem?: boolean;
}

export default function UserManagementAdmin() {
  const [, navigate] = useLocation();
  const { user: currentUser } = useAuth();

  // View state: 'list' (table screen) or 'form' (add/edit full screen)
  const [view, setView] = useState<"list" | "form">("list");

  const [loading, setLoading] = useState(true);
  const [primaryAdmin, setPrimaryAdmin] = useState<SystemUser | null>(null);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Form State
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRoleType, setSelectedRoleType] = useState<string>("Counsellor");
  const [customRoleName, setCustomRoleName] = useState("");
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [formIsActive, setFormIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Delete State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<SystemUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch users list
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.getSystemUsers();
      if (res) {
        setPrimaryAdmin(res.primaryAdmin || null);
        setUsers(res.users || []);
      }
    } catch (err: any) {
      console.error("fetchUsers error:", err);
      toast.error(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Open form page for new user
  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormEmail("");
    setFormPassword("");
    setShowPassword(false);
    setSelectedRoleType("Counsellor");
    setCustomRoleName("");
    setSelectedSections(ROLE_DEFAULT_SECTIONS["Counsellor"] || []);
    setFormIsActive(true);
    setView("form");
  };

  // Open form page for editing user
  const handleOpenEdit = (u: SystemUser) => {
    setEditingUser(u);
    setFormEmail(u.email);
    setFormPassword("");
    setShowPassword(false);

    if (PREDEFINED_ROLES.includes(u.role)) {
      setSelectedRoleType(u.role);
      setCustomRoleName("");
    } else {
      setSelectedRoleType("custom");
      setCustomRoleName(u.role);
    }

    setSelectedSections(u.sections || []);
    setFormIsActive(u.isActive);
    setView("form");
  };

  // Change role selection and auto-suggest sections for new users
  const handleRoleChange = (role: string) => {
    setSelectedRoleType(role);
    if (!editingUser) {
      if (role !== "custom" && ROLE_DEFAULT_SECTIONS[role]) {
        setSelectedSections(ROLE_DEFAULT_SECTIONS[role]);
      }
    }
  };

  // Toggle section checkbox
  const toggleSection = (key: string) => {
    setSelectedSections((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]
    );
  };

  // Select all sections
  const handleSelectAllSections = () => {
    setSelectedSections(MODULE_SECTIONS.map((s) => s.key));
  };

  // Clear all sections
  const handleClearAllSections = () => {
    setSelectedSections([]);
  };

  // Generate random password
  const generatePassword = () => {
    const chars =
      "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%";
    let pw = "";
    for (let i = 0; i < 10; i++) {
      pw += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormPassword(pw);
    setShowPassword(true);
  };

  // Save (Create or Update)
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();

    const email = formEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!editingUser && (!formPassword || formPassword.length < 6)) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    const finalRole =
      selectedRoleType === "custom"
        ? customRoleName.trim()
        : selectedRoleType;

    if (!finalRole) {
      toast.error("Please specify a role name");
      return;
    }

    if (selectedSections.length === 0) {
      const confirmNoSection = window.confirm(
        "No sections are selected for this user. They will have limited access. Continue?"
      );
      if (!confirmNoSection) return;
    }

    try {
      setSaving(true);
      if (editingUser) {
        // Update
        const payload: any = {
          email,
          role: finalRole,
          sections: selectedSections,
          isActive: formIsActive,
        };
        if (formPassword.trim()) {
          payload.password = formPassword.trim();
        }
        await api.updateSystemUser(editingUser.id, payload);
        toast.success("User updated successfully");
      } else {
        // Create
        await api.createSystemUser({
          email,
          password: formPassword.trim(),
          role: finalRole,
          sections: selectedSections,
          isActive: formIsActive,
        });
        toast.success("New user created successfully");
      }

      setView("list");
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to save user");
    } finally {
      setSaving(false);
    }
  };

  // Toggle user status
  const handleToggleStatus = async (u: SystemUser) => {
    try {
      await api.toggleSystemUserStatus(u.id, !u.isActive);
      toast.success(
        `User ${u.email} is now ${!u.isActive ? "Active" : "Inactive"}`
      );
      setUsers((prev) =>
        prev.map((item) =>
          item.id === u.id ? { ...item, isActive: !item.isActive } : item
        )
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  // Confirm delete
  const handleDeleteClick = (u: SystemUser) => {
    setUserToDelete(u);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    try {
      setDeleting(true);
      await api.deleteSystemUser(userToDelete.id);
      toast.success("User deleted successfully");
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user");
    } finally {
      setDeleting(false);
    }
  };

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.role.toLowerCase().includes(search.toLowerCase());

      const matchesRole =
        roleFilter === "all"
          ? true
          : roleFilter === "custom"
          ? !PREDEFINED_ROLES.includes(u.role)
          : u.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  // Section badge color helper
  const getSectionInfo = (key: string) => {
    return (
      MODULE_SECTIONS.find((s) => s.key === key) || {
        key,
        label: key,
        color: "#64748b",
      }
    );
  };

  // ================= VIEW 1: FULL SCREEN ADD / EDIT FORM =================
  if (view === "form") {
    return (
      <div className="p-6 md:p-8 space-y-6 min-h-screen bg-[#f8fafc] font-sans">
        <SEO
          title={`${editingUser ? "Edit User" : "Add User"} | WINGS Admin`}
          noindex={true}
        />

        {/* Form Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setView("list")}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-[#004689] flex items-center gap-1.5 font-bold text-sm"
              title="Back to User Management"
            >
              <ArrowLeft size={20} />
              <span>Back to Users</span>
            </button>
            <div className="h-6 w-px bg-gray-200" />
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#004689]">
                {editingUser ? "Edit User & Permissions" : "Add New User"}
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {editingUser
                  ? "Update staff credentials, role assignment and permitted modules."
                  : "Create new credentials and assign specific sections to staff."}
              </p>
            </div>
          </div>
        </div>

        {/* Full Page Form Card */}
        <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
          <form onSubmit={handleSaveUser} className="space-y-8">
            {/* Row 1: Email and Password (2-column responsive grid spanning full width) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              {/* Field 1: User Email */}
              <div className="w-full">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                  User Email <span className="text-red-500">*</span>
                </label>
                <div className="relative w-full">
                  <Mail
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="email"
                    required
                    placeholder="e.g. counsellor@wingscounselling.org"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#004689] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Field 2: Password */}
              <div className="w-full">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                    Password{" "}
                    {editingUser ? (
                      <span className="text-gray-400 font-normal">
                        (Leave blank to keep current)
                      </span>
                    ) : (
                      <span className="text-red-500">*</span>
                    )}
                  </label>
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="text-xs font-bold text-[#004689] hover:underline flex items-center gap-1"
                  >
                    <Sparkles size={13} />
                    <span>Generate Strong Password</span>
                  </button>
                </div>

                <div className="relative w-full">
                  <Lock
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    required={!editingUser}
                    placeholder={
                      editingUser
                        ? "Enter new password (optional)"
                        : "Enter user password (min 6 characters)"
                    }
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full pl-11 pr-11 py-3 rounded-xl border border-gray-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#004689] focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Row 2: Role Assignment (Full Width) */}
            <div className="w-full">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                Role Assignment <span className="text-red-500">*</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full mb-3">
                {PREDEFINED_ROLES.map((r) => {
                  const isSelected = selectedRoleType === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleRoleChange(r)}
                      className={`p-3.5 rounded-xl border text-xs font-bold transition-all text-center ${
                        isSelected
                          ? "bg-blue-50 border-[#004689] text-[#004689] shadow-sm ring-1 ring-[#004689]"
                          : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {r}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => handleRoleChange("custom")}
                  className={`p-3.5 rounded-xl border text-xs font-bold transition-all text-center ${
                    selectedRoleType === "custom"
                      ? "bg-blue-50 border-[#004689] text-[#004689] shadow-sm ring-1 ring-[#004689]"
                      : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  + Custom Role
                </button>
              </div>

              {/* Custom Role Input */}
              {selectedRoleType === "custom" && (
                <div className="w-full mt-2 animate-in fade-in duration-150">
                  <input
                    type="text"
                    required
                    placeholder="Enter custom role title (e.g. Volunteer Coordinator, Content Editor)..."
                    value={customRoleName}
                    onChange={(e) => setCustomRoleName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#004689] focus:border-transparent"
                  />
                </div>
              )}
            </div>

            {/* Row 3: Module or Section Select (Spanning Full Width in 4 Columns) */}
            <div className="w-full">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                    Module & Section Access Permissions
                  </label>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Select which sections this user can view and operate in the admin panel.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllSections}
                    className="text-xs font-bold text-[#004689] hover:underline"
                  >
                    Select All
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={handleClearAllSections}
                    className="text-xs font-bold text-gray-500 hover:underline"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Clean section grid spanning full width */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4 border border-gray-100 rounded-2xl bg-gray-50/50 w-full">
                {MODULE_SECTIONS.map((sec) => {
                  const checked = selectedSections.includes(sec.key);
                  const Icon = sec.icon;

                  return (
                    <div
                      key={sec.key}
                      onClick={() => toggleSection(sec.key)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        checked
                          ? "bg-white border-blue-400 shadow-sm ring-1 ring-blue-100"
                          : "bg-white/80 border-gray-200 opacity-80 hover:opacity-100 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: checked ? "#eff6ff" : "#f1f5f9",
                            color: checked ? sec.color : "#94a3b8",
                          }}
                        >
                          <Icon size={18} />
                        </div>
                        <span
                          className={`text-sm font-bold truncate ${
                            checked ? "text-gray-900" : "text-gray-700"
                          }`}
                        >
                          {sec.label}
                        </span>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                          checked
                            ? "bg-[#004689] border-[#004689] text-white"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        {checked && <Check size={13} strokeWidth={3} />}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-2.5 text-right">
                <span className="text-xs font-bold text-gray-500">
                  {selectedSections.length} of {MODULE_SECTIONS.length} modules selected
                </span>
              </div>
            </div>

            {/* Row 4: Account Status Toggle (Full Width) */}
            <div className="flex items-center justify-between pt-5 border-t border-gray-100 w-full">
              <div>
                <span className="text-sm font-bold text-gray-800">
                  Account Status
                </span>
                <p className="text-xs text-gray-400">
                  Inactive users cannot sign into the admin portal.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setFormIsActive(!formIsActive)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  formIsActive ? "bg-emerald-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formIsActive ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Row 5: Submit / Cancel Action Buttons (Full Width) */}
            <div className="pt-6 border-t border-gray-100 flex items-center gap-3 w-full">
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3 rounded-xl text-sm font-bold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, #004689 0%, #1e40af 100%)",
                }}
              >
                {saving
                  ? "Saving..."
                  : editingUser
                  ? "Save Changes"
                  : "Create User"}
              </button>

              <button
                type="button"
                onClick={() => setView("list")}
                disabled={saving}
                className="px-6 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ================= VIEW 2: LIST SCREEN =================
  return (
    <div className="p-6 md:p-8 space-y-8 min-h-screen bg-[#f8fafc] font-sans">
      <SEO title="User Management | WINGS Admin" noindex={true} />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
            title="Go to Dashboard"
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 18L9 12L15 6"
                stroke="#004689"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#004689]">
                User Management
              </h1>
              
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              Assign specific sections to counsellors & staff users with role-based access control.
            </p>
          </div>
        </div>

        {/* Top Add User Button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchUsers}
            disabled={loading}
            className="p-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
            title="Refresh list"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white shadow-md hover:shadow-lg transition-all transform active:scale-95"
            style={{
              background: "linear-gradient(135deg, #004689 0%, #1e40af 100%)",
            }}
          >
            <UserPlus size={18} />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Total Users
            </p>
            <h3 className="text-2xl font-black text-gray-800 mt-1">
              {users.length + (primaryAdmin ? 1 : 0)}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Including 1 Super Admin
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-[#004689]">
            <Users size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Active Users
            </p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">
              {users.filter((u) => u.isActive).length + (primaryAdmin ? 1 : 0)}
            </h3>
            <p className="text-xs text-gray-500 mt-1">Enabled & authorized</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <UserCheck size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Counsellors & Staff
            </p>
            <h3 className="text-2xl font-black text-indigo-600 mt-1">
              {
                users.filter(
                  (u) =>
                    u.role.toLowerCase().includes("counsellor") ||
                    u.role.toLowerCase().includes("executive")
                ).length
              }
            </h3>
            <p className="text-xs text-gray-500 mt-1">Section-assigned staff</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <ShieldCheck size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              System Modules
            </p>
            <h3 className="text-2xl font-black text-amber-600 mt-1">
              {MODULE_SECTIONS.length}
            </h3>
            <p className="text-xs text-gray-500 mt-1">Assignable sections</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <LayoutDashboard size={22} />
          </div>
        </div>
      </div>

      {/* Primary Administrator Showcase Card */}
      {primaryAdmin && (
        <div className="bg-[#004689]  rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-8">
            <Shield size={160} />
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="flex items-start md:items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0">
                <ShieldCheck size={30} className="text-blue-300" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wide bg-blue-500/30 text-blue-200 border border-blue-400/30">
                    Primary Super Administrator
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    System Master
                  </span>
                </div>
                <h3 className="text-xl font-bold mt-1 text-white">
                  {primaryAdmin.email}
                </h3>
                <p className="text-xs text-blue-200/80 mt-0.5">
                  Full root access to all {MODULE_SECTIONS.length} modules, database tables, and user management.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="px-4 py-2 rounded-xl bg-white/10 border border-white/15 text-xs font-semibold text-blue-100 flex items-center gap-2">
                <Sparkles size={14} className="text-amber-300" />
                <span>All Sections Assigned (Full Access)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Management Table Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Table Controls / Filters */}
        <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex-1 max-w-md relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search by email address or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#004689] focus:border-transparent transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-gray-500">Filter Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#004689]"
            >
              <option value="all">All Roles</option>
              <option value="Counsellor">Counsellor</option>
              <option value="Senior Counsellor">Senior Counsellor</option>
              <option value="Admin Executive">Admin Executive</option>
              <option value="custom">Custom Roles</option>
            </select>
          </div>
        </div>

        {/* Table Body */}
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw
              size={32}
              className="animate-spin text-[#004689] mx-auto mb-3"
            />
            <p className="text-sm font-semibold text-gray-500">
              Loading users and permission settings...
            </p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={48} className="text-gray-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-gray-700">
              No staff users found
            </h4>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              {search || roleFilter !== "all"
                ? "No users match your search criteria. Try adjusting filters."
                : ""}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-100 text-[11px] font-extrabold uppercase tracking-wider text-gray-500">
                  <th className="py-3.5 px-5">User / Email</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Assigned Sections</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Last Login</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredUsers.map((u) => {
                  const roleBadgeColor =
                    u.role === "Counsellor"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : u.role === "Senior Counsellor"
                      ? "bg-purple-50 text-purple-700 border-purple-200"
                      : u.role === "Admin Executive"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200";

                  const isCurrentUser =
                    currentUser &&
                    currentUser.email &&
                    currentUser.email.toLowerCase() === u.email.toLowerCase();

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-blue-50/30 transition-colors group"
                    >
                      {/* User Email */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 text-[#004689] flex items-center justify-center font-bold text-xs shrink-0">
                            {u.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-gray-800 flex items-center gap-1.5">
                              <span>{u.email}</span>
                              {isCurrentUser && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-blue-100 text-[#004689]">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-400 mt-0.5">
                              Created{" "}
                              {u.createdAt
                                ? new Date(u.createdAt).toLocaleDateString()
                                : "N/A"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${roleBadgeColor}`}
                        >
                          <Shield size={12} />
                          {u.role}
                        </span>
                      </td>

                      {/* Assigned Sections */}
                      <td className="py-4 px-4 max-w-xs">
                        {u.sections && u.sections.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {u.sections.slice(0, 3).map((secKey) => {
                              const s = getSectionInfo(secKey);
                              return (
                                <span
                                  key={secKey}
                                  className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-700"
                                >
                                  {s.label}
                                </span>
                              );
                            })}
                            {u.sections.length > 3 && (
                              <span
                                className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-[#004689]"
                                title={u.sections
                                  .map((k) => getSectionInfo(k).label)
                                  .join(", ")}
                              >
                                +{u.sections.length - 3} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-amber-600 font-medium italic">
                            No sections assigned
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(u)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                            u.isActive
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              : "bg-red-50 text-red-600 hover:bg-red-100"
                          }`}
                          title="Click to toggle active status"
                        >
                          {u.isActive ? (
                            <>
                              <CheckCircle2 size={13} className="text-emerald-600" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <XCircle size={13} className="text-red-500" />
                              <span>Inactive</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Last Login */}
                      <td className="py-4 px-4 whitespace-nowrap text-xs text-gray-500">
                        {u.lastLoginAt
                          ? new Date(u.lastLoginAt).toLocaleString("en-SG", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })
                          : "Never"}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-[#004689] hover:bg-blue-50 transition-colors"
                            title="Edit user details & permissions"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteClick(u)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete User Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete Staff User"
        message={`Are you sure you want to delete user "${userToDelete?.email}"? They will permanently lose access to all assigned sections.`}
        confirmLabel="Delete"
        confirmColor="#ef4444"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setUserToDelete(null);
        }}
      />
    </div>
  );
}
