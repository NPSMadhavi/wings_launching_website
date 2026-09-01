
import React, { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronDown,
  Search,
} from "lucide-react";

const API_BASE = "/api";

// Country phone digit rules: exact number of digits + dial code
const countryPhoneRules = {
  // "Afghanistan":        { digits: 9,  code: "+93"  },
  // "Albania":            { digits: 9,  code: "+355" },
  // "Algeria":            { digits: 9,  code: "+213" },
  // "Andorra":            { digits: 6,  code: "+376" },
  // "Angola":             { digits: 9,  code: "+244" },
  // "Argentina":          { digits: 10, code: "+54"  },
  // "Australia":          { digits: 9,  code: "+61"  },
  // "Austria":            { digits: 10, code: "+43"  },
  // "Bangladesh":         { digits: 10, code: "+880" },
  // "Belgium":            { digits: 9,  code: "+32"  },
  // "Brazil":             { digits: 11, code: "+55"  },
  // "Canada":             { digits: 10, code: "+1"   },
  // "China":              { digits: 11, code: "+86"  },
  // "Denmark":            { digits: 8,  code: "+45"  },
  // "Egypt":              { digits: 10, code: "+20"  },
  // "Finland":            { digits: 10, code: "+358" },
  // "France":             { digits: 9,  code: "+33"  },
  // "Germany":            { digits: 10, code: "+49"  },
  // "Greece":             { digits: 10, code: "+30"  },
  // "India":              { digits: 10, code: "+91"  },
  // "Indonesia":          { digits: 10, code: "+62"  },
  // "Iran":               { digits: 10, code: "+98"  },
  // "Iraq":               { digits: 10, code: "+964" },
  // "Ireland":            { digits: 9,  code: "+353" },
  // "Italy":              { digits: 10, code: "+39"  },
  // "Japan":              { digits: 10, code: "+81"  },
  // "Malaysia":           { digits: 10, code: "+60"  },
  // "Mexico":             { digits: 10, code: "+52"  },
  // "Nepal":              { digits: 10, code: "+977" },
  // "Netherlands":        { digits: 9,  code: "+31"  },
  // "New Zealand":        { digits: 9,  code: "+64"  },
  // "Norway":             { digits: 8,  code: "+47"  },
  // "Pakistan":           { digits: 10, code: "+92"  },
  // "Philippines":        { digits: 10, code: "+63"  },
  // "Poland":             { digits: 9,  code: "+48"  },
  // "Portugal":           { digits: 9,  code: "+351" },
  // "Russia":             { digits: 10, code: "+7"   },
  // "Saudi Arabia":       { digits: 9,  code: "+966" },
  "Singapore":          { digits: 8,  code: "+65"  },
  // "South Africa":       { digits: 9,  code: "+27"  },
  // "South Korea":        { digits: 10, code: "+82"  },
  // "Spain":              { digits: 9,  code: "+34"  },
  // "Sri Lanka":          { digits: 9,  code: "+94"  },
  // "Sweden":             { digits: 9,  code: "+46"  },
  // "Switzerland":        { digits: 9,  code: "+41"  },
  // "Thailand":           { digits: 9,  code: "+66"  },
  // "Turkey":             { digits: 10, code: "+90"  },
  // "United Arab Emirates": { digits: 9,  code: "+971" },
  // "United Kingdom":     { digits: 10, code: "+44"  },
  // "United States":      { digits: 10, code: "+1"   },
  // "Vietnam":            { digits: 9,  code: "+84"  },
};

// List of countries for nationality dropdown
const countries = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Argentina", "Australia", "Austria",
  "Bangladesh", "Belgium", "Brazil", "Canada", "China", "Denmark", "Egypt", "Finland",
  "France", "Germany", "Greece", "India", "Indonesia", "Iran", "Iraq", "Ireland",
  "Italy", "Japan", "Malaysia", "Mexico", "Nepal", "Netherlands", "New Zealand", "Norway",
  "Pakistan", "Philippines", "Poland", "Portugal", "Russia", "Saudi Arabia", "Singapore",
  "South Africa", "South Korea", "Spain", "Sri Lanka", "Sweden", "Switzerland", "Thailand",
  "Turkey", "United Arab Emirates", "United Kingdom", "United States", "Vietnam"
];

// Phone Input — fixed to Singapore (+65), 8 digits only
const PhoneInputWithCountry = ({ phone, onPhoneChange, onPhoneBlur, error }) => {
  const { t } = useTranslation();
  return (
    <div
      className={`flex items-stretch border rounded-[10px] bg-[#FAF8F4] transition-all ${
        error ? "border-red-500" : "border-[#E3E1E1]"
      }`}
    >
      {/* Fixed Singapore country code — not a dropdown */}
      <div className="flex items-center px-4 rounded-l-[10px] bg-[#F0EDE8] border-r border-[#E3E1E1] select-none">
        <span className="font-medium text-[15px] text-[#3A3A3A] whitespace-nowrap">+65</span>
      </div>

      {/* Phone number input — 8 digits max */}
      <input
        type="tel"
        name="phone"
        value={phone}
        onChange={onPhoneChange}
        onBlur={onPhoneBlur}
        placeholder={t("appointmentModal.step1.fields.phonePlaceholder")}
        maxLength={8}
        className="flex-1 min-w-0 px-4 py-4 text-[16px] bg-transparent outline-none rounded-r-[10px]"
      />
    </div>
  );
};

const normalizeSelectionText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const getSelectionLabel = (selection) => {
  if (!selection) return "";
  if (typeof selection === "string") return selection;

  return (
    selection.subTypeName ||
    selection.counselling_type_sub_name ||
    selection.serviceName ||
    selection.counsellingTypeName ||
    selection.counselling_type_name ||
    selection.title ||
    selection.name ||
    ""
  );
};

const APPOINTMENT_SELECTION_ALIASES = {
  "family support and counseling": "Family Counselling",
  "family support and counselling": "Family Counselling",
  "family support counselling": "Family Counselling",
  "family counseling": "Family Counselling",
  "couples counselling": "Couples Counselling",
  "couples counseling": "Couples Counselling",
  "marital and couple therapy": "Couples Counselling",
  "marital and couple counselling": "Couples Counselling",
  "individual therapy": "Individual Counselling",
  "individual counselling": "Individual Counselling",
  "individual counseling": "Individual Counselling",
  "adult counselling ages 21 65": "Individual Counselling",
  "adult counseling ages 21 65": "Individual Counselling",
  "children and youth counselling": "Group Counselling",
  "children and youth counseling": "Group Counselling",
  "youth counselling": "Group Counselling",
  "youth counseling": "Group Counselling",
  "pre school children ages 2 5 7": "Family Counselling",
  "pre school children": "Family Counselling",
  "child and play therapy": "Family Counselling",
  "family support counselling program": "Family Counselling",
  youth: "Group Counselling",
  adults: "Individual Counselling",
  "clinical supervision": "Supervision",
  "personal therapy for counsellors": "Personal therapy ( For counsellors )",
  workshops: "Workshops",
  "training and workshops": "Training & Workshops",
  "training workshop": "Training & Workshops",
};

const resolvePreselectedCounselling = (types, selection) => {
  if (!Array.isArray(types) || types.length === 0 || !selection) return null;

  if (typeof selection === "object") {
    const counsellingTypeId = Number(
      selection.counsellingTypeId ?? selection.counselling_type_id ?? selection.typeId
    );

    if (Number.isFinite(counsellingTypeId)) {
      const matchedTypeById = types.find(
        (type) => Number(type.id) === counsellingTypeId
      );

      if (matchedTypeById) {
        const subtypeId = Number(
          selection.subTypeId ??
          selection.sub_type_id ??
          selection.counsellingTypeSubId
        );

        const matchedSubTypeById = Number.isFinite(subtypeId)
          ? (matchedTypeById.sub_types || []).find(
              (subType) => Number(subType.id) === subtypeId
            )
          : null;

        return {
          type: matchedTypeById,
          subType: matchedSubTypeById || null,
        };
      }
    }

    const typeName =
      selection.counsellingTypeName ?? selection.counselling_type_name;
    const subTypeName =
      selection.subTypeName ??
      selection.sub_type_name ??
      selection.serviceName;

    if (typeName) {
      const matchedType = types.find(
        (type) => normalizeSelectionText(type.name) === normalizeSelectionText(typeName)
      );

      if (matchedType) {
        const matchedSubType = subTypeName
          ? (matchedType.sub_types || []).find(
              (subType) =>
                normalizeSelectionText(subType.name) === normalizeSelectionText(subTypeName)
            )
          : null;

        return {
          type: matchedType,
          subType: matchedSubType || null,
        };
      }
    }
  }

  const selectionLabel = getSelectionLabel(selection);
  const normalizedSelection = normalizeSelectionText(selectionLabel);

  if (!normalizedSelection) return null;

  for (const type of types) {
    const matchedSubType = (type.sub_types || []).find(
      (subType) => normalizeSelectionText(subType.name) === normalizedSelection
    );

    if (matchedSubType) {
      return {
        type,
        subType: matchedSubType,
      };
    }
  }

  const matchedType = types.find(
    (type) => normalizeSelectionText(type.name) === normalizedSelection
  );

  if (matchedType) {
    return {
      type: matchedType,
      subType: null,
    };
  }

  const aliasTargetName = APPOINTMENT_SELECTION_ALIASES[normalizedSelection];

  if (aliasTargetName) {
    const normalizedAliasTarget = normalizeSelectionText(aliasTargetName);

    for (const type of types) {
      const aliasMatchedSubType = (type.sub_types || []).find(
        (subType) => normalizeSelectionText(subType.name) === normalizedAliasTarget
      );

      if (aliasMatchedSubType) {
        return {
          type,
          subType: aliasMatchedSubType,
        };
      }
    }

    const aliasMatchedType = types.find(
      (type) => normalizeSelectionText(type.name) === normalizedAliasTarget
    );

    if (aliasMatchedType) {
      return {
        type: aliasMatchedType,
        subType: null,
      };
    }
  }

  return null;
};

// Custom Nationality Dropdown Component
const CustomNationalityDropdown = ({ value, onChange, onBlur, error }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCountries = countries.filter(country =>
    country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const VISIBLE_ROWS = 5;
  const ROW_HEIGHT_PX = 44;
  const listMaxHeight = VISIBLE_ROWS * ROW_HEIGHT_PX;

  const handleSelect = (country) => {
    onChange({ target: { name: 'nationality', value: country } });
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleTriggerBlur = (e) => {
    if (dropdownRef.current?.contains(e.relatedTarget)) return;
    onBlur?.({
      target: { name: "nationality", value },
    });
  };

  const handleTriggerKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsOpen((open) => !open);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        id="appointment-nationality"
        name="nationality"
        onClick={() => setIsOpen(!isOpen)}
        onBlur={handleTriggerBlur}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full px-5 py-4 border rounded-[10px] text-[16px] bg-[#FAF8F4] outline-none flex items-center justify-between cursor-pointer transition-all text-left ${error ? 'border-red-500' : 'border-[#E3E1E1]'
          } ${isOpen ? 'border-[#0D4A7A] ring-2 ring-[#0D4A7A]/20' : ''} focus:border-[#0D4A7A]`}
      >
        <span className={value ? "text-[#3A3A3A]" : "text-[#8F8F8F]"}>
          {value || t("appointmentModal.step1.fields.nationalityPlaceholder")}
        </span>
        <ChevronDown
          size={18}
          className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full bottom-full mb-1 bg-white border border-[#E3E1E1] rounded-[10px] shadow-lg">
          <div className="p-2 border-b border-[#E3E1E1]">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t("appointmentModal.step1.fields.searchCountry")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-[14px] border border-[#E3E1E1] rounded outline-none focus:border-[#0D4A7A]"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: listMaxHeight }}>
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => (
                <div
                  key={country}
                  onClick={() => handleSelect(country)}
                  className={`px-3 py-2 cursor-pointer hover:bg-gray-100 text-[14px] transition-colors ${value === country ? 'bg-blue-50 text-[#0D4A7A] font-medium' : ''
                    }`}
                >
                  {country}
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-gray-500 text-center">{t("appointmentModal.step1.fields.noCountries")}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export function AppointmentModal({ isOpen, onClose, preSelectedService }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [counsellingData, setCounsellingData] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [counsellingTypesError, setCounsellingTypesError] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [formData, setFormData] = useState({
    nric_fin_number: "",
    name: "",
    email: "",
    phone: "",
    age: "",
    gender: "",
    nationality: "",
    counselling_type_id: "",
    counselling_type_name: "",
    description: "",
  });

  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedSubTypeIds, setSelectedSubTypeIds] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [phoneCountry, setPhoneCountry] = useState("Singapore");
  const modalPanelRef = useRef(null);
  const scrollLockRef = useRef(0);

  const getModalFocusableElements = () => {
    if (!modalPanelRef.current) return [];
    return Array.from(
      modalPanelRef.current.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter(
      (el) =>
        el.getAttribute("aria-hidden") !== "true" &&
        !el.closest("[aria-hidden='true']")
    );
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleTabKey = (e) => {
      if (e.key !== "Tab") return;

      const focusable = getModalFocusableElements();
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleTabKey);
    return () => document.removeEventListener("keydown", handleTabKey);
  }, [isOpen, step, submitted, loadingTypes, counsellingData.length, formData.counselling_type_id]);

  useEffect(() => {
    if (!isOpen) return;

    const timer = window.setTimeout(() => {
      if (step === 2 && !loadingTypes && counsellingData.length > 0) {
        const firstCounsellingOption = modalPanelRef.current?.querySelector(
          "[data-counselling-type-option]"
        );
        firstCounsellingOption?.focus();
        return;
      }

      if (step === 3) {
        const descriptionField = modalPanelRef.current?.querySelector(
          'textarea[name="description"]'
        );
        descriptionField?.focus();
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [isOpen, step, loadingTypes, counsellingData.length]);

    useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Fetch counselling types and sub-types from API
  useEffect(() => {
    if (isOpen && step === 2 && counsellingData.length === 0) {
      fetchCounsellingTypes();
    }
  }, [isOpen, step]);

  useEffect(() => {
    if (!isOpen || step !== 2 || counsellingData.length === 0) return;

    const resolvedSelection = resolvePreselectedCounselling(
      counsellingData,
      preSelectedService
    );

    if (resolvedSelection?.type) {
      setFormData((prev) => ({
        ...prev,
        counselling_type_id: String(resolvedSelection.type.id),
        counselling_type_name: resolvedSelection.type.name,
      }));

      if (resolvedSelection.subType) {
        setSelectedServices([resolvedSelection.subType.name]);
        setSelectedSubTypeIds([resolvedSelection.subType.id]);
      } else {
        setSelectedServices([]);
        setSelectedSubTypeIds([]);
      }

      return;
    }

    if (!preSelectedService && !formData.counselling_type_id && counsellingData.length > 0) {
      const defaultType = counsellingData[0];

      setFormData((prev) => ({
        ...prev,
        counselling_type_id: String(defaultType.id),
        counselling_type_name: defaultType.name,
      }));

      setSelectedServices([]);
      setSelectedSubTypeIds([]);
    }
  }, [isOpen, step, counsellingData, preSelectedService]);

  const showSystemNotification = (title, body) => {
  if (!("Notification" in window)) {
    console.log("Notifications not supported");
    return;
  }

  if (Notification.permission === "granted") {
    createNotification(title, body);
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        createNotification(title, body);
      }
    });
  }
};

const createNotification = (title, body) => {
  const notification = new Notification(title, {
    body,
    icon: "/logo.png",
    badge: "/logo.png",
    vibrate: [200, 100, 200],
    requireInteraction: true,
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
  };
};

  const fetchCounsellingTypes = async () => {
    try {
      setLoadingTypes(true);
      setCounsellingTypesError("");
      const response = await fetch(`${API_BASE}/counselling-types`);
      if (!response.ok) {
        throw new Error(`Failed to load counselling types (${response.status})`);
      }
      const result = await response.json();
      
      if (result.success) {
        // Filter to only show Counselling & Therapy type
        const filteredData = result.data.filter(item => 
          item.name && item.name.toLowerCase().includes('counselling')
        );
        setCounsellingData(filteredData);
      } else {
        setCounsellingTypesError(result.message || "Failed to load counselling types.");
        console.error("Failed to fetch counselling types:", result.message);
      }
    } catch (error) {
      setCounsellingTypesError(t("appointmentModal.errors.loadingCounsellingTypes"));
      console.error("Error fetching counselling types:", error);
    } finally {
      setLoadingTypes(false);
    }
  };

  // Get current service options based on selected counselling type
  const getCurrentServiceOptions = () => {
    const selectedType = counsellingData.find(
      type => type.id === parseInt(formData.counselling_type_id)
    );
    return selectedType?.sub_types || [];
  };

  // ========== VALIDATION FUNCTIONS ==========
const validateNRIC = (nric) => {
  return "";
};

  const validateAge = (age) => {
    if (age === "" || age === null || age === undefined) return t("appointmentModal.validation.ageRequired");
    const num = Number(age);
    if (isNaN(num) || !Number.isInteger(num)) return t("appointmentModal.validation.ageInteger");
    if (num < 1) return t("appointmentModal.validation.ageMinimum");
    if (num > 120) return t("appointmentModal.validation.ageMaximum");
    return "";
  };

  const validateName = (name) => {
    if (!name || name.trim().length === 0) return t("appointmentModal.validation.nameRequired");

    const trimmed = name.trim();
    if (!/^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/.test(trimmed)) {
      return t("appointmentModal.validation.nameInvalid");
    }

    return "";
  };

  const validateEmail = (email) => {
    if (!email || email.length === 0) return t("appointmentModal.validation.emailRequired");
    const emailRegex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
    if (!emailRegex.test(email)) return t("appointmentModal.validation.emailInvalid");
    return "";
  };

const validatePhone = (phone, pCountry) => {
  if (!phone || phone.length === 0) {
    return t("appointmentModal.validation.phoneRequired");
  }

  const digitsOnly = phone.replace(/\D/g, "");

  if (digitsOnly.startsWith("0")) {
    return t("appointmentModal.validation.phoneLeadingZero");
  }

  if (!/^\d{8}$/.test(digitsOnly)) {
    return t("appointmentModal.validation.phoneInvalid");
  }

  return "";
};

  const validateGender = (gender) => {
    if (!gender) return t("appointmentModal.validation.genderRequired");
    return "";
  };

  const validateNationality = (nationality) => {
    if (!nationality) return t("appointmentModal.validation.nationalityRequired");
    return "";
  };

  const validateCounsellingType = (typeId) => {
    if (!typeId) return t("appointmentModal.validation.counsellingRequired");
    return "";
  };

  const validateDescription = (desc) => {
    if (!desc) return t("appointmentModal.validation.descriptionRequired");
    return "";
  };

  useEffect(() => {
    if (isOpen) {
      scrollLockRef.current = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollLockRef.current}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";

      return () => {
        const scrollY = scrollLockRef.current;
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.left = "";
        document.body.style.right = "";
        document.body.style.width = "";
        document.body.style.overflow = "";
        document.documentElement.style.overflow = "";
        window.scrollTo(0, scrollY);
      };
    }

    setSubmitted(false);
    setStep(1);
    setErrors({});
    setFormData({
      nric_fin_number: "",
      name: "",
      email: "",
      phone: "",
      age: "",
      gender: "",
      nationality: "",
      counselling_type_id: "",
      counselling_type_name: "",
      description: "",
    });
    setSelectedServices([]);
    setSelectedSubTypeIds([]);
    setCompletedSteps([]);
    setPhoneCountry("Singapore");
    setNameTouched(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;


    if (name === "name") {
      processedValue = value.replace(/[^A-Za-z\s'-]/g, "");
    }
    if (name === "age") {
      // Only allow positive integers up to 120
      const stripped = value.replace(/\D/g, '');
      const num = parseInt(stripped, 10);
      if (stripped === '') {
        processedValue = '';
      } else if (!isNaN(num)) {
        processedValue = Math.min(num, 120).toString();
      } else {
        processedValue = formData.age;
      }
    }
    if (name === "phone") {
      processedValue = value.replace(/\D/g, "").replace(/^0+/, "");
      const rule = phoneCountry && countryPhoneRules[phoneCountry];
      if (rule) {
        processedValue = processedValue.slice(0, rule.digits);
      } else {
        processedValue = processedValue.slice(0, 15);
      }
    }
    if (name === "nationality") {
      // Nationality change no longer affects phone
      setFormData((prev) => ({ ...prev, nationality: value }));
      if (errors.nationality) {
        setErrors((prev) => ({ ...prev, nationality: "" }));
      }
      return;
    }
    if (name === "counselling_type_id") {
      setSelectedServices([]);
      setSelectedSubTypeIds([]);
      const selectedType = counsellingData.find(type => type.id === parseInt(value));
      setFormData(prev => ({
        ...prev,
        counselling_type_id: value,
        counselling_type_name: selectedType?.name || ""
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));

    if (name === "name" && nameTouched) {
      setErrors((prev) => ({ ...prev, name: validateName(processedValue) }));
      return;
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    let error = "";

    if (name === "name") {
      setNameTouched(true);
    }

    switch (name) {
      case "nric_fin_number": error = validateNRIC(value); break;
      case "name": error = validateName(value); break;
      case "email": error = validateEmail(value); break;
      case "phone": error = validatePhone(value, phoneCountry); break;
      case "age": error = validateAge(value); break;
      case "gender": error = validateGender(value); break;
      case "nationality": error = validateNationality(value); break;
      case "counselling_type_id": error = validateCounsellingType(value); break;
      case "description": error = validateDescription(value); break;
      default: break;
    }
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handlePhoneCountryChange = (country) => {
    const rule = countryPhoneRules[country];
    // Trim existing phone digits to new country's max
    const trimmed = formData.phone
      ? formData.phone.replace(/\D/g, '').slice(0, rule ? rule.digits : 15)
      : '';
    setPhoneCountry(country);
    setFormData((prev) => ({ ...prev, phone: trimmed }));
    // Re-validate phone with new country
    const phoneError = trimmed ? validatePhone(trimmed, country) : "";
    setErrors((prev) => ({ ...prev, phone: phoneError }));
  };

  const handleServiceToggle = (service) => {    const serviceId = service.id;
    setSelectedSubTypeIds(prev =>
      prev.includes(serviceId) ? prev.filter(id => id !== serviceId) : [...prev, serviceId]
    );
    
    setSelectedServices(prev =>
      prev.includes(service.name) ? prev.filter(s => s !== service.name) : [...prev, service.name]
    );
  };

  const validateStep1 = () => {
    const newErrors = {
      name: validateName(formData.name),
      email: validateEmail(formData.email),
      phone: validatePhone(formData.phone, phoneCountry),
      age: validateAge(formData.age),
      gender: validateGender(formData.gender),
      nationality: validateNationality(formData.nationality),
    };
    setErrors(newErrors);
    
    const hasErrors = Object.values(newErrors).some(error => error !== "");
    return !hasErrors;
  };

  const validateStep2 = () => {
    const newErrors = {
      counselling_type_id: validateCounsellingType(formData.counselling_type_id),
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== "");
  };

  const validateStep3 = () => {
    const newErrors = {
      description: validateDescription(formData.description),
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== "");
  };

  const handleNext = () => {
    if (step === 1) {
      const isValid = validateStep1();
      if (isValid) {
        setCompletedSteps(prev => prev.includes(1) ? prev : [...prev, 1]);
        setStep(2);
      }
    } else if (step === 2) {
      const isValid = validateStep2();
      if (isValid) {
        setCompletedSteps(prev => prev.includes(2) ? prev : [...prev, 2]);
        setStep(3);
      }
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validateStep3()) return;

  const submitData = {
    nric_fin_number: formData.nric_fin_number,
    name: formData.name,
    age: formData.age,
    gender: formData.gender,
    nationality: formData.nationality,
    email: formData.email,
    phone: formData.phone,
    counselling_type: formData.counselling_type_name,
    sub_counselling_types: selectedServices.join(", ") || null,
    description: formData.description,
    remarks: null,
  };

  try {
    setLoading(true);

    const response = await fetch(`${API_BASE}/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(submitData),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || t("appointmentModal.errors.bookingFailed"));
      return;
    }

    // Success
    setSubmitted(true);

    setCompletedSteps((prev) =>
      prev.includes(3) ? prev : [...prev, 3]
    );

    // Browser/System Notification
    showSystemNotification(
      t("appointmentModal.success.notification.title"),
      t("appointmentModal.success.notification.body", { name: formData.name })
    );

  } catch (error) {
    console.error(error);
    alert(t("appointmentModal.errors.serverError"));
  } finally {
    setLoading(false);
  }
};

  const getStepTitle = () => {
    if (step === 1) return t("appointmentModal.step1.title");
    if (step === 2) return t("appointmentModal.step2.title");
    return t("appointmentModal.step3.title");
  };

  const getStepSubtitle = () => {
    if (step === 1) return t("appointmentModal.step1.subtitle");
    if (step === 2) return t("appointmentModal.step2.subtitle");
    return t("appointmentModal.step3.subtitle");
  };

  const isNameValid =
    nameTouched && formData.name.trim() && !validateName(formData.name);

  // Error message component with fixed height
  const ErrorMessage = ({ message }) => (
    <div className="h-5 mt-1">
      {message && <p className="text-red-500 text-xs">{message}</p>}
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100050] flex items-center justify-center p-3 sm:p-4 md:p-6 overscroll-contain">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            ref={modalPanelRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-10 bg-white w-full max-w-[1100px] max-h-[min(90dvh,calc(100dvh-2rem))] overflow-hidden rounded-[20px] shadow-2xl flex flex-col"
            role="dialog"
            aria-modal="true"
          >
            {/* Left side rectangle and Right side header */}
            <div className="flex items-start justify-between p-4 sm:p-6 md:p-8 pb-0 shrink-0">
              {/* Left side - Progress Rectangles */}
           <div className="flex items-center gap-2 mt-2">
  <div
    className={`w-[50px] sm:w-[70px] md:w-[90px] h-[6px] rounded-[5px] transition-all ${
      completedSteps.includes(1)
        ? "bg-[#B8E4A8]"  // Light Green for completed
        : step >= 1
        ? "bg-[#0D4A7A]"  // Blue for current
        : "bg-[#D9D9D9]"  // Gray for not reached
    }`}
  ></div>
  <div
    className={`w-[50px] sm:w-[70px] md:w-[90px] h-[6px] rounded-[5px] transition-all ${
      completedSteps.includes(2)
        ? "bg-[#B8E4A8]"  // Light Green for completed
        : step >= 2
        ? "bg-[#0D4A7A]"  // Blue for current
        : "bg-[#D9D9D9]"  // Gray for not reached
    }`}
  ></div>
  <div
    className={`w-[50px] sm:w-[70px] md:w-[90px] h-[6px] rounded-[5px] transition-all ${
      completedSteps.includes(3)
        ? "bg-[#B8E4A8]"  // Light Green for completed
        : step >= 3
        ? "bg-[#0D4A7A]"  // Blue for current
        : "bg-[#D9D9D9]"  // Gray for not reached
    }`}
  ></div>
</div>
              {/* Right side - Step and Close */}
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={t("appointmentModal.common.close")}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D4A7A] focus-visible:ring-offset-2"
                >
                  <X size={20} className="text-black" />
                </button>
              </div>
            </div>

            {submitted ? (
            <div className="p-4 sm:p-6 md:p-8 pt-4 sm:pt-6 flex-1 overflow-y-auto min-h-0">
                <div className="min-h-0 md:min-h-[480px] flex flex-col items-center justify-center text-center px-4 sm:px-8">
                  <div className="w-20 h-20 rounded-full bg-[#E8F3DC] flex items-center justify-center mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="#1F5500"/>
                    </svg>
                  </div>
                  <h2 className="text-[#0D4A7A] text-[clamp(20px,5vw,28px)] font-medium mb-3">
                    {t("appointmentModal.success.title")}
                  </h2>
                  <p className="text-[#3A3A3A] text-[16px] leading-relaxed max-w-[600px] mb-2">
                    {t("appointmentModal.success.message", { name: formData.name })}
                  </p>
                  <p className="text-[#5f6368] text-[14px] max-w-[520px] mb-8">
                    {t("appointmentModal.success.emailMessage", { email: formData.email })}
                  </p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-8 py-3 rounded-full bg-[#1B4585] text-white font-medium hover:bg-[#0D4A7A] transition-all"
                  >
                    {t("appointmentModal.success.button")}
                  </button>
                </div>
            </div>
            ) : (
              <form
                onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}
                className="flex flex-col flex-1 min-h-0"
              >
                <div className="p-4 sm:p-6 md:p-8 pt-4 sm:pt-6 flex-1 overflow-y-auto min-h-0">
                {/* Top Header Section */}
                <div className="flex items-start gap-4 sm:gap-[26px] mb-6 sm:mb-8">
                  {/* Icon Box - Changes based on step */}
                  <div className="w-[56px] h-[56px] sm:w-[70px] sm:h-[70px] rounded-[18px] bg-[#0D4A7A29] flex items-center justify-center flex-shrink-0">
                 {/* Step 1 Icon - Wings/Support themed */}
{step === 1 ? (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="40" 
    height="40" 
    viewBox="0 0 24 24" 
    fill="none"
    className="flex-shrink-0"
  >
    <path 
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" 
      fill="#0D4A7A"
    />
    <path 
      d="M12 8c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z" 
      fill="#0D4A7A"
    />
  </svg>
) : step === 2 ? (
  // Keep your existing Step 2 icon
  <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25" fill="none">
    <path d="M21.25 2.5H18.75V1.25C18.75 0.918479 18.6183 0.600537 18.3839 0.366116C18.1495 0.131696 17.8315 0 17.5 0C17.1685 0 16.8505 0.131696 16.6161 0.366116C16.3817 0.600537 16.25 0.918479 16.25 1.25V2.5H8.75V1.25C8.75 0.918479 8.6183 0.600537 8.38388 0.366116C8.14946 0.131696 7.83152 0 7.5 0C7.16848 0 6.85054 0.131696 6.61612 0.366116C6.3817 0.600537 6.25 0.918479 6.25 1.25V2.5H3.75C2.75544 2.5 1.80161 2.89509 1.09835 3.59835C0.395088 4.30161 0 5.25544 0 6.25V21.25C0 22.2446 0.395088 23.1984 1.09835 23.9017C1.80161 24.6049 2.75544 25 3.75 25H21.25C22.2446 25 23.1984 24.6049 23.9017 23.9017C24.6049 23.1984 25 22.2446 25 21.25V6.25C25 5.25544 24.6049 4.30161 23.9017 3.59835C23.1984 2.89509 22.2446 2.5 21.25 2.5ZM22.5 21.25C22.5 21.5815 22.3683 21.8995 22.1339 22.1339C21.8995 22.3683 21.5815 22.5 21.25 22.5H3.75C3.41848 22.5 3.10054 22.3683 2.86612 22.1339C2.6317 21.8995 2.5 21.5815 2.5 21.25V12.5H22.5V21.25ZM22.5 10H2.5V6.25C2.5 5.91848 2.6317 5.60054 2.86612 5.36612C3.10054 5.1317 3.41848 5 3.75 5H6.25V6.25C6.25 6.58152 6.3817 6.89946 6.61612 7.13388C6.85054 7.3683 7.16848 7.5 7.5 7.5C7.83152 7.5 8.14946 7.3683 8.38388 7.13388C8.6183 6.89946 8.75 6.58152 8.75 6.25V5H16.25V6.25C16.25 6.58152 16.3817 6.89946 16.6161 7.13388C16.8505 7.3683 17.1685 7.5 17.5 7.5C17.8315 7.5 18.1495 7.3683 18.3839 7.13388C18.6183 6.89946 18.75 6.58152 18.75 6.25V5H21.25C21.5815 5 21.8995 5.1317 22.1339 5.36612C22.3683 5.60054 22.5 5.91848 22.5 6.25V10Z" fill="#0D4A7A"/>
  </svg>
) : (
  // Keep your existing Step 3 icon
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 28 28" fill="none">
    <path d="M15.0266 8.18644L20.5963 9.66928M13.8343 12.6151L16.618 13.3571M13.9731 20.9603L15.0861 21.2578C18.2361 22.0978 19.8111 22.5166 21.0525 21.8038C22.2926 21.0921 22.715 19.5253 23.5585 16.3939L24.752 11.9641C25.5966 8.83161 26.0178 7.26594 25.3015 6.03161C24.5851 4.79728 23.0113 4.37844 19.8601 3.53961L18.7471 3.24211C15.5971 2.40211 14.0221 1.98328 12.782 2.69611C11.5406 3.40778 11.1183 4.97461 10.2736 8.10594L9.0813 12.5358C8.23663 15.6683 7.8143 17.2339 8.5318 18.4683C9.24813 19.7014 10.8231 20.1214 13.9731 20.9603Z" stroke="#0D4A7A" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M14 24.4369L12.8893 24.7402C9.74628 25.5954 8.17595 26.0236 6.93695 25.2967C5.70028 24.5711 5.27795 22.9739 4.43678 19.7807L3.24562 15.2634C2.40328 12.0702 1.98212 10.4731 2.69728 9.2154C3.31562 8.1269 4.66662 8.16656 6.41662 8.16656" stroke="#0D4A7A" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)}
                  </div>

                  {/* Text Content */}
                  <div className="pt-[2px] min-w-0 flex-1">
                    <h1 className="text-[#0D4A7A] text-[clamp(18px,4.5vw,25px)] font-medium leading-snug sm:leading-normal font-[Outfit] mb-[6px]">
                      {getStepTitle()}
                    </h1>
                    <p className="text-[#0D4A7A] text-[clamp(13px,3.5vw,15px)] font-normal leading-snug sm:leading-normal font-['DM_Sans'] max-w-[700px]">
                      {getStepSubtitle()}
                    </p>
                  </div>
                </div>

                {/* Fixed height container for form content */}
                <div className="min-h-0 md:min-h-[480px]">
                  {/* Step 1 - Personal Details */}
                  {step === 1 && (
                    <div className="space-y-4 sm:space-y-6">
                      {/* Row 1: NRIC/FIN Number and Name */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div>
                          <label className="text-[#0D4A7A] text-[clamp(14px,3.5vw,18px)] font-medium block mb-2">
                            {t("appointmentModal.step1.fields.nric")} <span className="text-red-500">*</span>
                          </label>
                    <input
  type="text"
  name="nric_fin_number"
  value={formData.nric_fin_number}
  onChange={handleChange}
  onBlur={handleBlur}
  placeholder={t("appointmentModal.step1.fields.nricPlaceholder")}
  className={`w-full px-5 py-4 border rounded-[10px] text-[16px] bg-[#FAF8F4] outline-none transition-all ${
    errors.nric_fin_number
      ? "border-red-500"
      : "border-[#E3E1E1]"
  } focus:border-[#0D4A7A]`}
/>
                          <div className="h-5 mt-1">
                            <p className="text-black text-xs font-medium">{t("appointmentModal.validation.nricRequired")}</p>
                          </div>
                        </div>

                        <div>
                          <label className="text-[#0D4A7A] text-[clamp(14px,3.5vw,18px)] font-medium block mb-2">
                            {t("appointmentModal.step1.fields.name")}<span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder={t("appointmentModal.step1.fields.namePlaceholder")}
                            className={`w-full px-5 py-4 border rounded-[10px] text-[16px] bg-[#FAF8F4] outline-none transition-all ${
                              errors.name
                                ? "border-red-500"
                                : isNameValid
                                  ? "border-green-500"
                                  : "border-[#E3E1E1]"
                            } focus:border-[#0D4A7A]`}
                          />
                          <ErrorMessage message={errors.name} />
                        </div>
                      </div>

                      {/* Row 2: Email Address and Phone Number */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div>
                          <label className="text-[#0D4A7A] text-[clamp(14px,3.5vw,18px)] font-medium block mb-2">
                            {t("appointmentModal.step1.fields.email")} <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder={t("appointmentModal.step1.fields.emailPlaceholder")}
                            className={`w-full px-5 py-4 border rounded-[10px] text-[16px] bg-[#FAF8F4] outline-none transition-all ${errors.email ? 'border-red-500' : 'border-[#E3E1E1]'
                              } focus:border-[#0D4A7A]`}
                          />
                          <ErrorMessage message={errors.email} />
                        </div>

                        <div>
                          <label className="text-[#0D4A7A] text-[clamp(14px,3.5vw,18px)] font-medium block mb-2">
                            {t("appointmentModal.step1.fields.phone")}<span className="text-red-500">*</span>
                          </label>
                          <PhoneInputWithCountry
                            phone={formData.phone}
                            onPhoneChange={handleChange}
                            onPhoneBlur={handleBlur}
                            error={errors.phone}
                          />
                          <ErrorMessage message={errors.phone} />
                        </div>
                      </div>

                      {/* Row 3: Age, Gender, Nationality */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        <div>
                          <label className="text-[#0D4A7A] text-[clamp(14px,3.5vw,18px)] font-medium block mb-2">
                            {t("appointmentModal.step1.fields.age")} <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            name="age"
                            value={formData.age}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder={t("appointmentModal.step1.fields.agePlaceholder")}
                            className={`w-full px-5 py-4 border rounded-[10px] text-[16px] bg-[#FAF8F4] outline-none transition-all ${errors.age ? 'border-red-500' : 'border-[#E3E1E1]'
                              } focus:border-[#0D4A7A]`}
                          />
                          <ErrorMessage message={errors.age} />
                        </div>

                        <div>
                          <label className="text-[#0D4A7A] text-[clamp(14px,3.5vw,18px)] font-medium block mb-2">
                            {t("appointmentModal.step1.fields.gender")} <span className="text-red-500">*</span>
                          </label>
                   <select
  name="gender"
  value={formData.gender}
  onChange={handleChange}
  onBlur={handleBlur}
  className={`w-full px-5 py-4 border rounded-[10px] text-[16px] text-[#666] bg-[#FAF8F4] outline-none transition-all appearance-none ${
    errors.gender ? "border-red-500" : "border-[#E3E1E1]"
  } focus:border-[#0D4A7A]`}
>
  <option value="">{t("appointmentModal.step1.fields.genderPlaceholder")}</option>
  <option value="Male">{t("appointmentModal.step1.genderOptions.male")}</option>
  <option value="Female">{t("appointmentModal.step1.genderOptions.female")}</option>
  <option value="Other">{t("appointmentModal.step1.genderOptions.other")}</option>
</select>
                          <ErrorMessage message={errors.gender} />
                        </div>

                        <div className="sm:col-span-2 lg:col-span-1">
                          <label
                            htmlFor="appointment-nationality"
                            className="text-[#0D4A7A] text-[clamp(14px,3.5vw,18px)] font-medium block mb-2"
                          >
                            {t("appointmentModal.step1.fields.nationality")} <span className="text-red-500">*</span>
                          </label>
                          <CustomNationalityDropdown
                            value={formData.nationality}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={errors.nationality}
                          />
                          <ErrorMessage message={errors.nationality} />
                        </div>
                      </div>

                    
<div className="bg-[#E8F3DC] rounded-[10px] p-5 flex gap-3 items-center">
  {/* Icon - Center aligned */}
  <div className="flex-shrink-0">
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="19" 
      height="21" 
      viewBox="0 0 19 21" 
      fill="none"
      className="block"
    >
      <path 
        d="M9.375 4.21588e-09C10.9921 -5.93512e-05 12.5462 0.626631 13.7109 1.7484C14.8756 2.87017 15.5602 4.3997 15.6208 6.01563L15.625 6.25H16.6667C17.1923 6.24983 17.6985 6.44834 18.0839 6.80573C18.4693 7.16311 18.7054 7.65296 18.7448 8.17708L18.75 8.33333V18.75C18.7502 19.2756 18.5517 19.7818 18.1943 20.1672C17.8369 20.5526 17.347 20.7887 16.8229 20.8281L16.6667 20.8333H2.08333C1.55773 20.8335 1.05149 20.635 0.666096 20.2776C0.280699 19.9202 0.0446286 19.4304 0.00520856 18.9063L1.04446e-07 18.75V8.33333C-0.000166228 7.80773 0.19834 7.30149 0.555726 6.9161C0.913112 6.5307 1.40296 6.29463 1.92708 6.25521L2.08333 6.25H3.125C3.125 4.5924 3.78348 3.00269 4.95558 1.83058C6.12769 0.65848 7.7174 4.21588e-09 9.375 4.21588e-09ZM16.6667 8.33333H2.08333V18.75H16.6667V8.33333ZM9.375 10.4167C9.81936 10.4168 10.252 10.559 10.6098 10.8226C10.9676 11.0861 11.2318 11.4571 11.3637 11.8814C11.4957 12.3057 11.4885 12.7611 11.3432 13.1811C11.1979 13.601 10.9222 13.9635 10.5562 14.2156L10.4167 14.3042V15.625C10.4164 15.8905 10.3147 16.1459 10.1324 16.3389C9.95019 16.532 9.70109 16.6482 9.43605 16.6637C9.171 16.6793 8.91002 16.5931 8.70642 16.4226C8.50283 16.2522 8.37198 16.0105 8.34062 15.7469L8.33333 15.625V14.3042C7.93619 14.0749 7.62581 13.7209 7.45032 13.2972C7.27484 12.8735 7.24405 12.4038 7.36275 11.9608C7.48144 11.5178 7.74298 11.1264 8.1068 10.8472C8.47063 10.568 8.9164 10.4167 9.375 10.4167ZM9.375 2.08333C8.26993 2.08333 7.21012 2.52232 6.42872 3.30372C5.64732 4.08512 5.20833 5.14493 5.20833 6.25H13.5417C13.5417 5.14493 13.1027 4.08512 12.3213 3.30372C11.5399 2.52232 10.4801 2.08333 9.375 2.08333Z" 
        fill="#1F5500" 
      />
    </svg>
  </div>
  
  {/* Content - Starts exactly from right side of icon */}
  <p className="text-[#1F5500] text-[13px] font-medium leading-[19px]">
    {t("appointmentModal.step1.privacyNotice")}
  </p>
</div>
                    </div>
                  )}

                  {/* Step 2 - Counselling Selection */}
  {step === 2 && (
  <div className="flex flex-col min-h-[320px] sm:min-h-[400px] h-auto">
    {loadingTypes ? (
      <div className="text-center py-8">
        <p className="text-[#0D4A7A]">{t("appointmentModal.step2.loading")}</p>
      </div>
    ) : (
      <>
        {counsellingTypesError && counsellingData.length === 0 && (
          <div className="mb-4 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between gap-3">
            <span>{counsellingTypesError}</span>
            <button
              type="button"
              onClick={fetchCounsellingTypes}
              className="shrink-0 rounded-full border border-red-300 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
            >
              {t("appointmentModal.common.retry")}
            </button>
          </div>
        )}

        {/* Scrollable content area - this will scroll if content overflows */}
        <div className="flex-1 overflow-y-auto pr-2">
          <div>
            <label className="text-[#0D4A7A] text-[16px] font-medium block mb-4">
              {t("appointmentModal.step2.counsellingType")} <span className="text-red-500">*</span>
            </label>
            <div
              className={`grid gap-3 sm:gap-4 ${
                counsellingData.length === 1 
                  ? 'grid-cols-1 max-w-xs mx-auto' 
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              }`}
              role="radiogroup"
              aria-label="Select counselling type"
            >
              {counsellingData.map(option => (
                <button
                  key={option.id}
                  type="button"
                  data-counselling-type-option
                  role="radio"
                  aria-checked={parseInt(formData.counselling_type_id, 10) === option.id}
                  onClick={() => {
                    const event = {
                      target: {
                        name: 'counselling_type_id',
                        value: option.id.toString()
                      }
                    };
                    handleChange(event);
                    if (errors.counselling_type_id) {
                      setErrors(prev => ({ ...prev, counselling_type_id: "" }));
                    }
                  }}
                  className={`py-4 px-6 rounded-[10px] text-[16px] font-medium transition-all focus-visible:outline-none focus-visible:ring-0 ${
                    parseInt(formData.counselling_type_id) === option.id
                      ? 'bg-[#E3F1FC] text-[#0D4A7A] border-2 border-[#0D4A7A]'
                      : 'bg-[#FAF8F4] text-[#3A3A3A] border border-[#E3E1E1] hover:border-[#0D4A7A] focus-visible:border-2 focus-visible:border-[#0D4A7A]'
                  }`}
                  style={{
                    width: '100%',
                    height: '75px',
                    padding: '14px 24px',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: '10px',
                  }}
                >
                  {option.name}
                </button>
              ))}
            </div>
            <ErrorMessage message={errors.counselling_type_id} />
          </div>

          {/* Service Options - Based on selected counselling type */}
          {formData.counselling_type_id && getCurrentServiceOptions().length > 0 && (
            <div className="mt-6">
              <label className="text-[#0D4A7A] text-[16px] font-medium block mb-4">
                {t("appointmentModal.step2.supportWith")} ({formData.counselling_type_name})
              </label>
              <div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
                role="group"
                aria-label="Select support options"
              >
                {getCurrentServiceOptions().map(service => (
                  <button
                    key={service.id}
                    type="button"
                    data-support-option
                    role="checkbox"
                    aria-checked={selectedSubTypeIds.includes(service.id)}
                    onClick={() => handleServiceToggle(service)}
                    className={`py-4 px-6 rounded-[10px] text-[16px] font-medium transition-all text-center focus-visible:outline-none focus-visible:ring-0 ${
                      selectedSubTypeIds.includes(service.id)
                        ? 'bg-[#E3F1FC] text-[#0D4A7A] border-2 border-[#0D4A7A]'
                        : 'bg-[#FAF8F4] text-[#3A3A3A] border border-[#E3E1E1] hover:border-[#0D4A7A] focus-visible:border-2 focus-visible:border-[#0D4A7A]'
                    }`}
                    style={{
                      width: '100%',
                      height: '75px',
                      padding: '14px 24px',
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderRadius: '10px',
                    }}
                  >
                    {service.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Info Box - Fixed at bottom, never moves */}
        <div className="bg-[#E8F3DC] rounded-[10px] p-5 flex gap-3 items-center mt-4 flex-shrink-0">
          <div className="flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M4 2C3.46957 2 2.96086 2.21071 2.58579 2.58579C2.21071 2.96086 2 3.46957 2 4V16C2 16.5304 2.21071 17.0391 2.58579 17.4142C2.96086 17.7893 3.46957 18 4 18H8V21C8 21.2652 8.10536 21.5196 8.29289 21.7071C8.48043 21.8946 8.73478 22 9 22H9.5C9.75 22 10 21.9 10.2 21.71L13.9 18H20C20.5304 18 21.0391 17.7893 21.4142 17.4142C21.7893 17.0391 22 16.5304 22 16V4C22 3.46957 21.7893 2.96086 21.4142 2.58579C21.0391 2.21071 20.5304 2 20 2H4ZM4 4H20V16H13.08L10 19.08V16H4V4ZM12.19 5.5C11.3 5.5 10.59 5.68 10.05 6.04C9.5 6.4 9.22 7 9.27 7.69H11.24C11.24 7.41 11.34 7.2 11.5 7.06C11.7 6.92 11.92 6.85 12.19 6.85C12.5 6.85 12.77 6.93 12.95 7.11C13.13 7.28 13.22 7.5 13.22 7.8C13.22 8.08 13.14 8.33 13 8.54C12.83 8.76 12.62 8.94 12.36 9.08C11.84 9.4 11.5 9.68 11.29 9.92C11.1 10.16 11 10.5 11 11H13C13 10.72 13.05 10.5 13.14 10.32C13.23 10.15 13.4 10 13.66 9.85C14.12 9.64 14.5 9.36 14.79 9C15.08 8.63 15.23 8.24 15.23 7.8C15.23 7.1 14.96 6.54 14.42 6.12C13.88 5.71 13.13 5.5 12.19 5.5ZM11 12V14H13V12H11Z" fill="#1F5500"/>
            </svg>
          </div>
          <p className="text-[#1F5500] text-[15px] font-medium leading-[19px]">
            {t("appointmentModal.step2.helpNote")}
          </p>
        </div>
      </>
    )}
  </div>
)}
                  {/* Step 3 - Description */}
{step === 3 && (
  <div className="flex flex-col min-h-[320px] sm:min-h-[400px] h-auto">
    <div className="flex-1 overflow-y-auto pr-2">
      <div className="space-y-4">
        <div>
          <label className="text-[#0D4A7A] text-[16px] font-medium block mb-2">
            {t("appointmentModal.step3.descriptionLabel")} <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={t("appointmentModal.step3.descriptionPlaceholder")}
            rows={8}
            className={`w-full h-[280px] p-5 border rounded-[10px] text-[15px] bg-[#FAF8F4] outline-none transition-all resize-none ${errors.description ? 'border-red-500' : 'border-[#E3E1E1]'
              } focus:border-[#0D4A7A]`}
          />
          <ErrorMessage message={errors.description} />
        </div>

        <p className="text-[#3A3A3A] text-[14px] mt-2">
          {t("appointmentModal.step3.descriptionHelp")}
        </p>
      </div>
    </div>

  {/* Info Box - Checkbox with updated text */}
<div className="bg-[#E8F3DC] rounded-[10px] p-5 flex gap-3 items-start mt-3 flex-shrink-0">
  <input
    type="checkbox"
    required
    className="mt-0.5 w-4 h-4 accent-[#1F5500] flex-shrink-0"
  />
  <div className="flex-1">
    <p className="text-[#1F5500] text-[14px] font-medium leading-[19px]">
      {t("appointmentModal.step3.consent")}
    </p>
  </div>
</div>
  </div>
)}
                </div>
                </div>

                {/* Navigation Buttons — fixed footer, does not scroll */}
                <div className="flex-shrink-0 flex flex-row justify-end items-center gap-3 sm:gap-4 px-4 sm:px-6 md:px-8 py-4 border-t border-gray-100 bg-white rounded-b-[20px]">
                  {step > 1 && (
                    <button
                      type="button" 
                      onClick={handleBack}
                      className="px-8 py-3 rounded-full border border-[#0D4A7A] text-[#0D4A7A] font-medium hover:bg-gray-50 transition-all flex items-center gap-2 focus-visible:outline-none focus-visible:ring-0 focus-visible:border-2"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="24"
                        viewBox="0 0 12 24"
                        fill="none"
                        className="rotate-180"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M10.157 12.711L4.5 18.368L3.086 16.954L8.036 12.004L3.086 7.05401L4.5 5.64001L10.157 11.297C10.3445 11.4845 10.4498 11.7389 10.4498 12.004C10.4498 12.2692 10.3445 12.5235 10.157 12.711Z"
                          fill="#0D4A7A"
                        />
                      </svg>{t("appointmentModal.common.back")}</button>
                  )}

                  {step < 3 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="px-8 py-3 rounded-full bg-[#1B4585] text-white font-medium flex items-center gap-2 hover:bg-[#0D4A7A] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1B4585]"
                    >{t("appointmentModal.common.continue")}<svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="24"
                        viewBox="0 0 12 24"
                        fill="none"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M10.157 12.711L4.5 18.368L3.086 16.954L8.036 12.004L3.086 7.05401L4.5 5.64001L10.157 11.297C10.3445 11.4845 10.4498 11.7389 10.4498 12.004C10.4498 12.2692 10.3445 12.5235 10.157 12.711Z"
                          fill="white"
                        />
                      </svg>
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-8 py-3 rounded-full bg-[#1B4585] text-white font-medium hover:bg-[#0D4A7A] transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {loading ? t("appointmentModal.common.submit") : t("appointmentModal.common.submit")}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="24"
                        viewBox="0 0 12 24"
                        fill="none"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M10.157 12.711L4.5 18.368L3.086 16.954L8.036 12.004L3.086 7.05401L4.5 5.64001L10.157 11.297C10.3445 11.4845 10.4498 11.7389 10.4498 12.004C10.4498 12.2692 10.3445 12.5235 10.157 12.711Z"
                          fill="white"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
