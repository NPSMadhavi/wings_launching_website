import React, { useEffect, useMemo, useState } from "react";
import {
    Search,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Eye,
    Pencil,
    Trash2,
    X,
    FileText,
    Download,
    ExternalLink,
} from "lucide-react";
import { ConfirmDialog } from "../components/ConfirmDialog";

const API_BASE = "/api";
const PAGE_SIZE = 10;

function parseSubCounsellingTypes(
    value?: string | null,
    fallback?: string | null
): string[] {
    if (!value && !fallback) return [];

    let str = value || fallback || "";

    try {
        if (str.startsWith("[") && str.endsWith("]")) {
            const parsed = JSON.parse(str);
            if (Array.isArray(parsed)) {
                return parsed.map((item) => String(item).trim()).filter(Boolean);
            }
        }
    } catch (e) {
        // Ignore JSON error
    }

    return str
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
}

function getEffectiveEnquirerType(item: any): string {
    if (item?.enquirer_type) return item.enquirer_type;
    if (item?.referral_agency_name || item?.referral_agency_contact_person || item?.referral_agency_contact_email) {
        return "Referral Agency";
    }
    if (item?.enquirer_name || item?.enquirer_relationship || item?.relationship || item?.enquirer_contact_number || item?.enquirer_email) {
        return "Enquirer";
    }
    return "Self";
}

function SubCounsellingTypesTable({
    value,
    fallback,
}: {
    value?: string | null;
    fallback?: string | null;
}) {
    const items = parseSubCounsellingTypes(value, fallback);

    if (items.length === 0) {
        return <span className="text-gray-400">-</span>;
    }

    return (
        <table className="w-full min-w-[180px] text-xs border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-[#F8FAFC]">
            </thead>
            <tbody>
                {items.map((name, index) => (
                    <tr key={`${name}-${index}`} className="border-t border-gray-100">
                        <td className="px-2 py-1.5 text-gray-500">{index + 1}</td>
                        <td className="px-2 py-1.5 text-gray-800 font-medium">{name}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

export default function AppointmentsPage() {

    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showExport, setShowExport] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    // State for View/Edit Modal
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState("view"); // "view" or "edit"
    const [editFormData, setEditFormData] = useState({});
    const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);

    // State for Expandable Row & Attachments Modal
    const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
    const [viewingAttachmentsItem, setViewingAttachmentsItem] = useState<any | null>(null);

    const getAppointmentAttachments = (item: any) => {
        if (!item) return [];
        const list: any[] = [];
        if (Array.isArray(item.attachments)) list.push(...item.attachments);
        if (item.referral_agency_attachment_1_data || item.referral_agency_attachment_1) {
            list.push({
                name: item.referral_agency_attachment_1 || "Referral_Attachment_1",
                data: item.referral_agency_attachment_1_data || item.referral_agency_attachment_1,
            });
        }
        if (item.referral_agency_attachment_2_data || item.referral_agency_attachment_2) {
            list.push({
                name: item.referral_agency_attachment_2 || "Referral_Attachment_2",
                data: item.referral_agency_attachment_2_data || item.referral_agency_attachment_2,
            });
        }
        if (item.attachment1) list.push(item.attachment1);
        if (item.attachment2) list.push(item.attachment2);

        const unique: any[] = [];
        const names = new Set();
        for (const file of list) {
            const name = typeof file === "string" ? file : file?.name || file?.filename || "Attachment";
            if (name && !names.has(name)) {
                names.add(name);
                unique.push(typeof file === "string" ? { name: file, data: file } : file);
            }
        }
        return unique;
    };

    const handleBack = () => {
  window.history.back();
};
    /* ================= FETCH ================= */

    const fetchAppointments = async () => {
        try {
            const response = await fetch(`${API_BASE}/appointments`);
            const data = await response.json();
            setAppointments(data.appointments || []);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    /* ================= DELETE ================= */

    const handleDelete = async () => {
        if (deleteTarget == null) return;
        setDeleting(true);

        try {
            const response = await fetch(
                `${API_BASE}/appointments/${deleteTarget}`,
                {
                    method: "DELETE",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                return;
            }

            setDeleteTarget(null);
            fetchAppointments();

        } catch (error) {
            console.log(error);
        } finally {
            setDeleting(false);
        }
    };

    /* ================= VIEW APPOINTMENT ================= */

    const handleView = (appointment) => {
        setSelectedAppointment(appointment);
        setModalMode("view");
        setShowModal(true);
    };

    /* ================= EDIT APPOINTMENT ================= */

    const handleEdit = (appointment) => {
        setSelectedAppointment(appointment);
        setEditFormData({
            nric_fin_number: appointment.nric_fin_number || '',
            name: appointment.name || '',
            age: appointment.age || '',
            gender: appointment.gender || '',
            nationality: appointment.nationality || '',
            email: appointment.email || '',
            phone: appointment.phone || '',
            counselling_type: appointment.counselling_type || '',
            sub_counselling_types:
                appointment.sub_counselling_types || appointment.remarks || '',
            description: appointment.description || '',
            remarks: appointment.remarks || '',
        });
        setModalMode("edit");
        setShowModal(true);
    };

    const handleEditChange = (e) => {
        setEditFormData({
            ...editFormData,
            [e.target.name]: e.target.value
        });
    };

    const handleUpdate = async () => {
        // Convert empty strings to null for database
        const cleanedData = {
            nric_fin_number: editFormData.nric_fin_number || null,
            name: editFormData.name || null,
            age: editFormData.age ? parseInt(editFormData.age) : null,
            gender: editFormData.gender || null,
            nationality: editFormData.nationality || null,
            email: editFormData.email || null,
            phone: editFormData.phone || null,
            counselling_type: editFormData.counselling_type || null,
            sub_counselling_types: editFormData.sub_counselling_types || null,
            description: editFormData.description || null,
            remarks: editFormData.remarks || null,
        };

        try {
            const response = await fetch(
                `${API_BASE}/appointments/${selectedAppointment.id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(cleanedData),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                return;
            }

            setShowModal(false);
            fetchAppointments();

        } catch (error) {
            console.log(error);
        }
    };

    /* ================= EXPORT FUNCTIONS ================= */

    const exportCSV = () => {
        const headers = [
            "NRIC/FIN Number",
            "Name",
            "Age",
            "Gender",
            "Email",
            "Phone",
            "Counselling Type",
            "Sub Counselling Types",
            "Description",
            "Remarks"
        ];

        const rows = appointments.map((item) => [
            `"${(item.nric_fin_number || '').replace(/"/g, '""')}"`,
            `"${(item.name || '').replace(/"/g, '""')}"`,
            item.age || '',
            `"${(item.gender || '').replace(/"/g, '""')}"`,
            `"${(item.email || '').replace(/"/g, '""')}"`,
            `"${(item.phone || '').replace(/"/g, '""')}"`,
            `"${(item.counselling_type || '').replace(/"/g, '""')}"`,
            `"${(item.sub_counselling_types || item.remarks || '').replace(/"/g, '""')}"`,
            `"${(item.description || '').replace(/"/g, '""')}"`,
            `"${(item.remarks || '').replace(/"/g, '""')}"`,
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.join(","))
            .join("\n");

        const blob = new Blob(["\uFEFF" + csvContent], {
            type: "text/csv;charset=utf-8;",
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `appointments_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setShowExport(false);
    };

    const exportExcel = () => {
        const headers = [
            "NRIC",
            "Name",
            "Age",
            "Gender",
            "Email",
            "Phone",
            "Concerns",
            "Enquirer Type",
            "Description"
        ];

        const rows = appointments.map((item) => [
            `"${(item.nric_fin_number || '').replace(/"/g, '""')}"`,
            `"${(item.name || '').replace(/"/g, '""')}"`,
            item.age || '',
            `"${(item.gender || '').replace(/"/g, '""')}"`,
            `"${(item.email || '').replace(/"/g, '""')}"`,
            `"${(item.phone || '').replace(/"/g, '""')}"`,
            `"${((item.type_of_concern === 'Others' ? item.type_of_concern_other : item.type_of_concern) || '').replace(/"/g, '""')}"`,
            `"${getEffectiveEnquirerType(item).replace(/"/g, '""')}"`,
            `"${(item.description || '').replace(/"/g, '""')}"`,
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.join(","))
            .join("\n");

        const blob = new Blob(["\uFEFF" + csvContent], {
            type: "application/vnd.ms-excel",
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `appointments_${new Date().toISOString().split('T')[0]}.xls`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setShowExport(false);
    };

    const exportPDF = async () => {
        try {
            const { default: jsPDF } = await import('jspdf');
            const html2canvas = (await import('html2canvas')).default;

            // Create a temporary div for PDF content
            const pdfContent = document.createElement('div');
            pdfContent.style.padding = '20px';
            pdfContent.style.backgroundColor = 'white';
            pdfContent.style.fontFamily = 'Arial, sans-serif';
            pdfContent.style.width = '1200px';

            // Add title
            const title = document.createElement('h1');
            title.textContent = 'Appointments Report';
            title.style.color = '#0F172A';
            title.style.marginBottom = '10px';
            title.style.fontSize = '24px';
            pdfContent.appendChild(title);

            // Add date
            const date = document.createElement('p');
            date.textContent = `Generated on: ${new Date().toLocaleString()}`;
            date.style.color = '#666';
            date.style.marginBottom = '20px';
            pdfContent.appendChild(date);

            // Create table
            const table = document.createElement('table');
            table.style.width = '100%';
            table.style.borderCollapse = 'collapse';
            table.style.marginTop = '20px';

            // Add headers
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            const headers = ['NRIC', 'Name', 'Age', 'Gender', 'Email', 'Phone', 'Concerns', 'Enquirer Type', 'Description'];

            headers.forEach(header => {
                const th = document.createElement('th');
                th.textContent = header;
                th.style.border = '1px solid #ddd';
                th.style.padding = '8px';
                th.style.backgroundColor = '#f2f2f2';
                th.style.textAlign = 'left';
                th.style.fontSize = '12px';
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);

            // Add data rows
            const tbody = document.createElement('tbody');
            appointments.forEach(appointment => {
                const row = document.createElement('tr');
                const rowData = [
                    appointment.nric_fin_number || '',
                    appointment.name || '',
                    appointment.age || '',
                    appointment.gender || '',
                    appointment.email || '',
                    appointment.phone || '',
                    appointment.type_of_concern === 'Others' ? appointment.type_of_concern_other : (appointment.type_of_concern || ''),
                    getEffectiveEnquirerType(appointment),
                    (appointment.description || '').substring(0, 100)
                ];

                rowData.forEach(data => {
                    const td = document.createElement('td');
                    td.textContent = data;
                    td.style.border = '1px solid #ddd';
                    td.style.padding = '8px';
                    td.style.fontSize = '11px';
                    row.appendChild(td);
                });
                tbody.appendChild(row);
            });
            table.appendChild(tbody);
            pdfContent.appendChild(table);

            // Append to body temporarily
            document.body.appendChild(pdfContent);

            // Generate PDF
            const canvas = await html2canvas(pdfContent, {
                scale: 2,
                logging: false,
                useCORS: true
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            const imgWidth = 297; // A4 landscape width in mm
            const pageHeight = 210; // A4 landscape height in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`appointments_${new Date().toISOString().split('T')[0]}.pdf`);

            // Clean up
            document.body.removeChild(pdfContent);
            setShowExport(false);
        } catch (error) {
            console.error("PDF Export Error:", error);
        }
    };

    /* ================= FILTER & PAGINATION ================= */

    const filteredAppointments = useMemo(
        () =>
            appointments.filter((item) =>
                item.name?.toLowerCase().includes(search.toLowerCase()) ||
                item.email?.toLowerCase().includes(search.toLowerCase()) ||
                item.phone?.toLowerCase().includes(search.toLowerCase()) ||
                item.nric_fin_number?.toLowerCase().includes(search.toLowerCase()) ||
                item.counselling_type?.toLowerCase().includes(search.toLowerCase()) ||
                item.sub_counselling_types?.toLowerCase().includes(search.toLowerCase()) ||
                item.remarks?.toLowerCase().includes(search.toLowerCase())
            ),
        [appointments, search]
    );

    const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / PAGE_SIZE));

    const paginatedAppointments = useMemo(
        () =>
            filteredAppointments.slice(
                (currentPage - 1) * PAGE_SIZE,
                currentPage * PAGE_SIZE
            ),
        [filteredAppointments, currentPage]
    );

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    return (
        <div className="w-full min-h-screen bg-[#F8FAFC] p-6">

            {/* HEADER */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-6">
             <div className="flex items-center gap-2 min-w-0">
  <button
    onClick={handleBack}
    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
  >
    <svg
      width="32"
      height="32"
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

  <h1 className="text-3xl md:text-4xl font-bold text-[#0D4A7A] ">
    Appointments
  </h1>
</div>

                {/* RIGHT */}
                <div className="flex items-center gap-4">
                    {/* SEARCH */}
                    <div className="relative w-full lg:w-[320px]">
                        <Search
                            size={18}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                            type="text"
                            placeholder="Search appointments..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="
                w-full h-[46px]
                bg-white
                border border-gray-200
                rounded-xl
                pl-10 pr-4
                text-sm
                outline-none
                focus:border-[#004689]
              "
                        />
                    </div>

                    {/* EXPORT */}
                    <div className="relative">
                        <button
                            onClick={() => setShowExport(!showExport)}
                            className="
                h-[46px]
                px-5
                rounded-xl
                bg-[#004689]
                text-white
                flex items-center gap-2
                font-semibold
                shadow-sm
                hover:opacity-95
                transition-all
              "
                        >
                            {/* <Download size={18} /> */}
                            Export
                            <ChevronDown size={16} />
                        </button>

                        {/* DROPDOWN */}
                        {showExport && (
                            <>
                                {/* Overlay */}
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setShowExport(false)}
                                />

                                {/* Dropdown */}
                                <div
                                    className="
                    absolute right-0 mt-2
                    w-44
                    bg-white
                    rounded-xl
                    border border-gray-200
                    shadow-2xl
                    overflow-hidden
                    z-50
                    animate-in fade-in zoom-in-95
                "
                                >
                                    <button
                                        onClick={exportExcel}
                                        className="
                        w-full px-4 py-3
                        text-left text-sm font-medium
                        hover:bg-gray-100
                        transition-colors
                    "
                                    >
                                        Excel
                                    </button>

                                    <button
                                        onClick={exportPDF}
                                        className="
                        w-full px-4 py-3
                        text-left text-sm font-medium
                        hover:bg-gray-100
                        transition-colors
                        border-t border-gray-100
                    "
                                    >
                                        PDF
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* TABLE CARD */}
            <div
                className="
          bg-white
          rounded-3xl
          border border-gray-100
          shadow-sm
          overflow-hidden
        "
            >

                {/* TABLE */}
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1400px]">
                        <thead className="bg-[#eef2ff]">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">
                                    NRIC
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">
                                    Name
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">
                                    Age
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">
                                    Gender
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">
                                    Email
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">
                                    Phone
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">
                                    Concerns
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">
                                    Enquirer Type
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">
                                    Description
                                </th>
                                <th className="px-6 py-4 text-center text-sm font-semibold text-blue-900">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={10} className="text-center py-16 text-gray-500">
                                        Loading appointments...
                                    </td>
                                </tr>
                            ) : paginatedAppointments.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="text-center py-16 text-gray-400">
                                        No appointments found
                                    </td>
                                </tr>
                            ) : (
                                paginatedAppointments.map((item: any, index: number) => (
                                    <React.Fragment key={item.id}>
                                        <tr
                                            className={`
                      border-b border-gray-50
                      hover:bg-[#F8FAFC]
                      transition-all
                      ${index % 2 === 0 ? "bg-white" : "bg-[#FCFCFD]"}
                    `}
                                        >
                                            <td className="px-6 py-5 text-sm text-gray-700">
                                                {item.nric_fin_number || '-'}
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className=" text-gray-700 text-[15px]">
                                                        {item.name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-sm text-gray-700">
                                                {item.age || '-'}
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="px-3 py-1 rounded-full text-xs text-gray-700">
                                                    {item.gender}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-sm text-gray-700">
                                                {item.email}
                                            </td>
                                            <td className="px-6 py-5 text-sm text-gray-700">
                                                {item.phone}
                                            </td>
                                            <td className="px-6 py-5 text-sm text-gray-700">
                                                {item.type_of_concern === "Others" ? item.type_of_concern_other : (item.type_of_concern || '-')}
                                            </td>
                                            <td className="px-6 py-5 text-sm text-gray-700">
                                                {getEffectiveEnquirerType(item)}
                                            </td>
                                            <td className="px-6 py-5 text-sm text-gray-700 max-w-[200px]">
                                                <div className="line-clamp-2">
                                                    {item.description || '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center justify-center gap-3">
                                                    <button
                                                        onClick={() => handleView(item)}
                                                        className="w-9 h-9 rounded-xl flex items-center justify-center hover:scale-105 transition-all text-blue-900"
                                                        title="View"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteTarget(item.id)}
                                                        className="w-9 h-9 rounded-xl flex items-center justify-center hover:scale-105 transition-all text-red-600"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>

                                                    {getEffectiveEnquirerType(item) !== "Self" && (
                                                        <button
                                                            onClick={() => setExpandedRowId(expandedRowId === item.id ? null : item.id)}
                                                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                                                                expandedRowId === item.id ? "bg-[#0D4A7A] text-white" : "hover:bg-gray-100 text-gray-700"
                                                            }`}
                                                            title="Toggle Details"
                                                        >
                                                            <ChevronDown size={16} className={`transition-transform duration-200 ${expandedRowId === item.id ? "rotate-180" : ""}`} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>

                                        {expandedRowId === item.id && getEffectiveEnquirerType(item) !== "Self" && (
                                            <tr key={`expanded-${item.id}`} className="bg-[#F0F7FA]/70 border-b border-blue-100">
                                                <td colSpan={10} className="px-8 py-5">
                                                    <div className="bg-white rounded-2xl p-5 border border-blue-100 shadow-sm space-y-4">
                                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-3">
                                                            <div>
                                                                <h4 className="text-base font-bold text-[#0D4A7A] flex items-center gap-2">
                                                                    <FileText size={18} />
                                                                    {getEffectiveEnquirerType(item) === "Referral Agency" ? "Referral Agency Details" : "Enquirer Details"}
                                                                </h4>
                                                            </div>

                                                            {getEffectiveEnquirerType(item) === "Referral Agency" && (
                                                                <button
                                                                    onClick={() => setViewingAttachmentsItem(item)}
                                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#0D4A7A] text-white text-xs font-semibold rounded-xl hover:bg-[#003460] transition-all shadow-sm"
                                                                >
                                                                    <FileText size={14} />
                                                                    <span>View Attachments</span>
                                                                    {getAppointmentAttachments(item).length > 0 && (
                                                                        <span className="bg-white text-[#0D4A7A] px-2 py-0.5 rounded-full text-[10px] font-bold ml-1">
                                                                            {getAppointmentAttachments(item).length}
                                                                        </span>
                                                                    )}
                                                                </button>
                                                            )}
                                                        </div>

                                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                                            {getEffectiveEnquirerType(item) === "Referral Agency" ? (
                                                                <>
                                                                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                                        <span className="text-gray-400 block uppercase font-bold text-[10px] mb-1">Referral Agency Name</span>
                                                                        <span className="text-gray-900 font-semibold text-sm">{item.referral_agency_name || "-"}</span>
                                                                    </div>
                                                                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                                        <span className="text-gray-400 block uppercase font-bold text-[10px] mb-1">Referral Agency Contact Person</span>
                                                                        <span className="text-gray-900 font-semibold text-sm">{item.referral_agency_contact_person || "-"}</span>
                                                                    </div>
                                                                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                                        <span className="text-gray-400 block uppercase font-bold text-[10px] mb-1">Referral Agency Contact Email</span>
                                                                        <span className="text-gray-900 font-semibold text-sm">{item.referral_agency_contact_email || "-"}</span>
                                                                    </div>
                                                                    {item.referral_agency_password && (
                                                                        <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                                                                            <span className="text-amber-800 block uppercase font-bold text-[10px] mb-1">Document Password</span>
                                                                            <span className="text-amber-900 font-mono font-bold text-sm bg-white px-2 py-0.5 rounded border border-amber-300 inline-block">{item.referral_agency_password}</span>
                                                                        </div>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                                        <span className="text-gray-400 block uppercase font-bold text-[10px] mb-1">Enquirer Name</span>
                                                                        <span className="text-gray-900 font-semibold text-sm">{item.enquirer_name || "-"}</span>
                                                                    </div>
                                                                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                                        <span className="text-gray-400 block uppercase font-bold text-[10px] mb-1">Relationship</span>
                                                                        <span className="text-gray-900 font-semibold text-sm">{item.enquirer_relationship || item.relationship || "-"}</span>
                                                                    </div>
                                                                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                                        <span className="text-gray-400 block uppercase font-bold text-[10px] mb-1">Enquirer Contact Number</span>
                                                                        <span className="text-gray-900 font-semibold text-sm">{item.enquirer_contact_number || "-"}</span>
                                                                    </div>
                                                                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                                        <span className="text-gray-400 block uppercase font-bold text-[10px] mb-1">Enquirer Email Address</span>
                                                                        <span className="text-gray-900 font-semibold text-sm">{item.enquirer_email || "-"}</span>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {!loading && filteredAppointments.length > 0 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-[#FCFCFD]">
                       About the service
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                disabled={currentPage <= 1}
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-white"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <span className="text-sm font-medium text-gray-700 px-2">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                type="button"
                                disabled={currentPage >= totalPages}
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-white"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* VIEW/EDIT MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-[#0D4A7A] px-6 py-5 flex justify-between items-center">
                            <div>
                            <h3 className="text-2xl font-bold text-white">
                                {modalMode === "view" ? "Appointment Details" : "Edit Appointment"}
                            </h3>
                              <p className="text-blue-100 text-sm mt-1">Fill in the details below</p>
                              </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-white hover:text-blue-200 transition-colors p-2 hover:bg-white/10 rounded-full"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {modalMode === "view" ? (
                                // View Mode
                                <>
                                    <table className="w-full text-left border-collapse">
                                        <tbody>
                                            <tr className="border-b border-gray-100">
                                                <th className="py-3 pr-4 text-xs font-bold text-gray-500 uppercase w-1/3">NRIC</th>
                                                <td className="py-3 text-gray-900 font-medium">{selectedAppointment?.nric_fin_number || '-'}</td>
                                            </tr>
                                            <tr className="border-b border-gray-100">
                                                <th className="py-3 pr-4 text-xs font-bold text-gray-500 uppercase">Name</th>
                                                <td className="py-3 text-gray-900 font-medium">{selectedAppointment?.name}</td>
                                            </tr>
                                            <tr className="border-b border-gray-100">
                                                <th className="py-3 pr-4 text-xs font-bold text-gray-500 uppercase">Age</th>
                                                <td className="py-3 text-gray-900 font-medium">{selectedAppointment?.age || '-'}</td>
                                            </tr>
                                            <tr className="border-b border-gray-100">
                                                <th className="py-3 pr-4 text-xs font-bold text-gray-500 uppercase">Gender</th>
                                                <td className="py-3 text-gray-900 font-medium">{selectedAppointment?.gender}</td>
                                            </tr>
                                            <tr className="border-b border-gray-100">
                                                <th className="py-3 pr-4 text-xs font-bold text-gray-500 uppercase">Nationality</th>
                                                <td className="py-3 text-gray-900 font-medium">{selectedAppointment?.nationality || '-'}</td>
                                            </tr>
                                            <tr className="border-b border-gray-100">
                                                <th className="py-3 pr-4 text-xs font-bold text-gray-500 uppercase">Email</th>
                                                <td className="py-3 text-gray-900 font-medium">{selectedAppointment?.email}</td>
                                            </tr>
                                            <tr className="border-b border-gray-100">
                                                <th className="py-3 pr-4 text-xs font-bold text-gray-500 uppercase">Phone</th>
                                                <td className="py-3 text-gray-900 font-medium">{selectedAppointment?.phone}</td>
                                            </tr>
                                            <tr className="border-b border-gray-100">
                                                <th className="py-3 pr-4 text-xs font-bold text-gray-500 uppercase">Concerns</th>
                                                <td className="py-3 text-gray-900 font-medium">
                                                    {selectedAppointment?.type_of_concern === "Others" 
                                                        ? selectedAppointment?.type_of_concern_other 
                                                        : (selectedAppointment?.type_of_concern || '-')}
                                                </td>
                                            </tr>
                                            <tr className="border-b border-gray-100">
                                                <th className="py-3 pr-4 text-xs font-bold text-gray-500 uppercase">Enquirer Type</th>
                                                <td className="py-3 text-gray-900 font-medium">{selectedAppointment?.enquirer_type || 'Enquirer'}</td>
                                            </tr>

                                            {selectedAppointment?.enquirer_name && (
                                                <tr className="border-b border-gray-100">
                                                    <th className="py-3 pr-4 text-xs font-bold text-gray-500 uppercase">Enquirer Name</th>
                                                    <td className="py-3 text-gray-900 font-medium">{selectedAppointment.enquirer_name}</td>
                                                </tr>
                                            )}
                                            {(selectedAppointment?.enquirer_relationship || selectedAppointment?.relationship) && (
                                                <tr className="border-b border-gray-100">
                                                    <th className="py-3 pr-4 text-xs font-bold text-gray-500 uppercase">Relationship</th>
                                                    <td className="py-3 text-gray-900 font-medium">{selectedAppointment.enquirer_relationship || selectedAppointment.relationship}</td>
                                                </tr>
                                            )}
                                            {selectedAppointment?.enquirer_contact_number && (
                                                <tr className="border-b border-gray-100">
                                                    <th className="py-3 pr-4 text-xs font-bold text-gray-500 uppercase">Enquirer Contact Number</th>
                                                    <td className="py-3 text-gray-900 font-medium">{selectedAppointment.enquirer_contact_number}</td>
                                                </tr>
                                            )}
                                            {selectedAppointment?.enquirer_email && (
                                                <tr className="border-b border-gray-100">
                                                    <th className="py-3 pr-4 text-xs font-bold text-gray-500 uppercase">Enquirer Email Address</th>
                                                    <td className="py-3 text-gray-900 font-medium">{selectedAppointment.enquirer_email}</td>
                                                </tr>
                                            )}

                                            {selectedAppointment?.referral_agency_name && (
                                                <tr className="border-b border-gray-100">
                                                    <th className="py-3 pr-4 text-xs font-bold text-gray-500 uppercase">Referral Agency Name</th>
                                                    <td className="py-3 text-gray-900 font-medium">{selectedAppointment.referral_agency_name}</td>
                                                </tr>
                                            )}
                                            {selectedAppointment?.referral_agency_contact_person && (
                                                <tr className="border-b border-gray-100">
                                                    <th className="py-3 pr-4 text-xs font-bold text-gray-500 uppercase">Referral Agency Contact Person</th>
                                                    <td className="py-3 text-gray-900 font-medium">{selectedAppointment.referral_agency_contact_person}</td>
                                                </tr>
                                            )}
                                            {selectedAppointment?.referral_agency_contact_email && (
                                                <tr className="border-b border-gray-100">
                                                    <th className="py-3 pr-4 text-xs font-bold text-gray-500 uppercase">Referral Agency Contact Email</th>
                                                    <td className="py-3 text-gray-900 font-medium">{selectedAppointment.referral_agency_contact_email}</td>
                                                </tr>
                                            )}

                                            <tr className="border-b border-gray-100">
                                                <th className="py-3 pr-4 text-xs font-bold text-gray-500 uppercase align-top">Description</th>
                                                <td className="py-3 text-gray-900 whitespace-pre-wrap">{selectedAppointment?.description || '-'}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </>
                            ) : (
                                // Edit Mode
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-semibold text-gray-700 block mb-2">NRIC/FIN Number</label>
                                            <input
                                                type="text"
                                                name="nric_fin_number"
                                                value={editFormData.nric_fin_number || ''}
                                                onChange={handleEditChange}
                                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#004689]"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-sm font-semibold text-gray-700 block mb-2">Name *</label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={editFormData.name || ''}
                                                onChange={handleEditChange}
                                                required
                                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#004689]"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-sm font-semibold text-gray-700 block mb-2">Age</label>
                                            <input
                                                type="number"
                                                name="age"
                                                value={editFormData.age || ''}
                                                onChange={handleEditChange}
                                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#004689]"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-sm font-semibold text-gray-700 block mb-2">Gender *</label>
                                            <select
                                                name="gender"
                                                value={editFormData.gender || ''}
                                                onChange={handleEditChange}
                                                required
                                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#004689]"
                                            >
                                                <option value="">Select Gender</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-sm font-semibold text-gray-700 block mb-2">Nationality</label>
                                            <input
                                                type="text"
                                                name="nationality"
                                                value={editFormData.nationality || ''}
                                                onChange={handleEditChange}
                                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#004689]"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-sm font-semibold text-gray-700 block mb-2">Email *</label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={editFormData.email || ''}
                                                onChange={handleEditChange}
                                                required
                                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#004689]"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-sm font-semibold text-gray-700 block mb-2">Phone *</label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={editFormData.phone || ''}
                                                onChange={handleEditChange}
                                                required
                                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#004689]"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-sm font-semibold text-gray-700 block mb-2">Counselling Type *</label>
                                            <input
                                                type="text"
                                                name="counselling_type"
                                                value={editFormData.counselling_type || ''}
                                                onChange={handleEditChange}
                                                required
                                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#004689]"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 block mb-2">
                                            Sub Counselling Types
                                        </label>
                                        <textarea
                                            name="sub_counselling_types"
                                            value={editFormData.sub_counselling_types || ''}
                                            onChange={handleEditChange}
                                            rows="3"
                                            placeholder="Comma-separated sub types"
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#004689]"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 block mb-2">Description</label>
                                        <textarea
                                            name="description"
                                            value={editFormData.description || ''}
                                            onChange={handleEditChange}
                                            rows="3"
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#004689]"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 block mb-2">Remarks</label>
                                        <textarea
                                            name="remarks"
                                            value={editFormData.remarks || ''}
                                            onChange={handleEditChange}
                                            rows="2"
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#004689]"
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-6 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all"
                            >
                                Close
                            </button>
                            {modalMode === "edit" && (
                                <button
                                    onClick={handleUpdate}
                                    className="px-6 py-2 rounded-xl bg-[#004689] text-white hover:opacity-95 transition-all"
                                >
                                    Save
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={deleteTarget !== null}
                loading={deleting}
                title="Delete Appointment"
                message="This appointment will be permanently deleted."
                confirmLabel="Delete"
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />
            {/* ATTACHMENTS VIEW MODAL */}
            {viewingAttachmentsItem && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0D4A7A] flex items-center justify-center">
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">
                                        Uploaded Documents
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        Submitted by {viewingAttachmentsItem.name} ({viewingAttachmentsItem.enquirer_type || 'Enquirer'})
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setViewingAttachmentsItem(null)}
                                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {viewingAttachmentsItem.referral_agency_password && (
                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
                                <span className="text-xs font-semibold text-amber-900">
                                    Document Protection Password:
                                </span>
                                <code className="bg-white text-amber-900 font-bold font-mono px-3 py-1 rounded-lg border border-amber-300 text-sm">
                                    {viewingAttachmentsItem.referral_agency_password}
                                </code>
                            </div>
                        )}

                        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                            {getAppointmentAttachments(viewingAttachmentsItem).length === 0 ? (
                                <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                    <FileText size={36} className="mx-auto mb-2 opacity-40" />
                                    <p className="text-sm font-medium">No attached documents found for this submission.</p>
                                </div>
                            ) : (
                                getAppointmentAttachments(viewingAttachmentsItem).map((file: any, idx: number) => {
                                    const fileName = typeof file === 'string' ? file : file.name || `Document_${idx + 1}`;
                                    const fileData = typeof file === 'object' && file.data ? file.data : (typeof file === 'string' ? file : '');

                                    const openFile = () => {
                                        if (!fileData) return;
                                        try {
                                            if (fileData.startsWith('data:')) {
                                                const arr = fileData.split(',');
                                                const mimeMatch = arr[0].match(/:(.*?);/);
                                                const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
                                                const bstr = atob(arr[1]);
                                                let n = bstr.length;
                                                const u8arr = new Uint8Array(n);
                                                while (n--) {
                                                    u8arr[n] = bstr.charCodeAt(n);
                                                }
                                                const blob = new Blob([u8arr], { type: mime });
                                                const blobUrl = URL.createObjectURL(blob);
                                                window.open(blobUrl, '_blank');
                                                return;
                                            }
                                        } catch (e) {
                                            console.warn('Failed to convert data URI to blob:', e);
                                        }
                                        window.open(fileData, '_blank');
                                    };

                                    return (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100/80 rounded-2xl border border-gray-200/80 transition-all">
                                            <div className="flex items-center gap-3 min-w-0 pr-2">
                                                <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#0D4A7A] flex items-center justify-center shrink-0">
                                                    <FileText size={18} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-gray-800 truncate">
                                                        {fileName}
                                                    </p>
                                                    <p className="text-[11px] text-gray-400">
                                                        Uploaded Attachment #{idx + 1}
                                                    </p>
                                                </div>
                                            </div>

                                            {fileData && (
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <button
                                                        onClick={openFile}
                                                        className="px-3.5 py-1.5 bg-[#0D4A7A] text-white text-xs font-semibold rounded-xl hover:bg-[#003460] transition-all flex items-center gap-1.5 shadow-sm"
                                                    >
                                                        <ExternalLink size={13} />
                                                        <span>View</span>
                                                    </button>
                                                    <a
                                                        href={fileData}
                                                        download={fileName}
                                                        className="px-3 py-1.5 border border-gray-300 text-gray-700 text-xs font-medium rounded-xl hover:bg-white transition-all flex items-center gap-1.5"
                                                    >
                                                        <Download size={13} />
                                                        <span>Download</span>
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                onClick={() => setViewingAttachmentsItem(null)}
                                className="px-6 py-2.5 bg-gray-100 text-gray-700 font-semibold text-xs rounded-xl hover:bg-gray-200 transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}