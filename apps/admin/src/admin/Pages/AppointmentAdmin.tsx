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
} from "lucide-react";
import { ConfirmDialog } from "../components/ConfirmDialog";

const API_BASE = "/api";
const PAGE_SIZE = 10;

function parseSubCounsellingTypes(
    value?: string | null,
    fallback?: string | null
): string[] {
    const raw = value || fallback;
    if (!raw) return [];
    return raw
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
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
            const headers = ['NRIC/FIN', 'Name', 'Age', 'Gender', 'Email', 'Phone', 'Counselling Type', 'Sub Counselling Types', 'Description', 'Remarks'];

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
                    appointment.counselling_type || '',
                    (appointment.sub_counselling_types || appointment.remarks || '').substring(0, 100),
                    (appointment.description || '').substring(0, 100),
                    (appointment.remarks || '').substring(0, 100)
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
                                    NRIC/FIN
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
                                    Mail
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">
                                    Phone
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">
                                    Counselling Type
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">
                                    Sub Counselling Types
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">
                                    Description
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">
                                    Remarks
                                </th>
                                <th className="px-6 py-4 text-center text-sm font-semibold text-blue-900">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="11" className="text-center py-16 text-gray-500">
                                        Loading appointments...
                                    </td>
                                </tr>
                            ) : paginatedAppointments.length === 0 ? (
                                <tr>
                                    <td colSpan="11" className="text-center py-16 text-gray-400">
                                        No appointments found
                                    </td>
                                </tr>
                            ) : (
                                paginatedAppointments.map((item, index) => (
                                    <tr
                                        key={item.id}
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
                                       <td className="px-6 py-5 text-left">
  <span className="inline-block px-3 py-1 rounded-full text-xs   text-gray-700 text-left">
    {item.counselling_type}
  </span>
</td>
                                        <td className="px-6 py-5 align-top">
                                            <SubCounsellingTypesTable
                                                value={item.sub_counselling_types}
                                                fallback={item.remarks}
                                            />
                                        </td>
                                        <td className="px-6 py-5 text-sm text-gray-700 max-w-[200px]">
                                            <div className="line-clamp-2">
                                                {item.description || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-sm text-gray-700 max-w-[200px]">
                                            <div className="line-clamp-2">
                                                {item.remarks || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center justify-center gap-3">
                                                <button
                                                    onClick={() => handleView(item)}
                                                    className="w-9 h-9 rounded-xl flex items-center justify-center hover:scale-105 transition-all"
                                                    title="View"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteTarget(item.id)}
                                                    className="w-9 h-9 rounded-xl  flex items-center justify-center hover:scale-105 transition-all"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
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
                                                <th className="py-3 pr-4 text-xs font-bold text-gray-500 uppercase w-1/3">NRIC/FIN Number</th>
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
                                                <th className="py-3 pr-4 text-xs font-bold text-gray-500 uppercase">Counselling Type</th>
                                                <td className="py-3 text-gray-900 font-medium">{selectedAppointment?.counselling_type}</td>
                                            </tr>
                                            <tr className="border-b border-gray-100">
                                                <th className="py-3 pr-4 text-xs font-bold text-gray-500 uppercase align-top">Sub Counselling Types</th>
                                                <td className="py-3">
                                                    <div className="flex flex-wrap gap-2">
                                                        <SubCounsellingTypesTable
                                                            value={selectedAppointment?.sub_counselling_types}
                                                            fallback={selectedAppointment?.remarks}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr className="border-b border-gray-100">
                                                <th className="py-3 pr-4 text-xs font-bold text-gray-500 uppercase align-top">Description</th>
                                                <td className="py-3 text-gray-900 whitespace-pre-wrap">{selectedAppointment?.description || '-'}</td>
                                            </tr>
                                            <tr>
                                                <th className="py-3 pr-4 text-xs font-bold text-gray-500 uppercase align-top">Remarks</th>
                                                <td className="py-3 text-gray-900 whitespace-pre-wrap">{selectedAppointment?.remarks || '-'}</td>
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
        </div>
    );
}