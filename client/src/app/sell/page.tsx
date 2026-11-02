'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/api';
import { University, Category, Book, BookCondition, ListingType, SmartPriceSuggestion } from '@/types';
import {
  BookOpen,
  GraduationCap,
  Image as ImageIcon,
  DollarSign,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  UploadCloud,
  X,
  AlertCircle,
  Loader2,
  Trash2,
  ArrowRight,
  Eye,
  Tag,
  Sparkles,
  School,
  FileText,
  BadgePercent,
  Check,
} from 'lucide-react';

interface BookFormData {
  title: string;
  author: string;
  isbn: string;
  edition: string;
  publisher: string;
  publicationYear: string;
  description: string;
  category: string;
  university: string;
  subject: string;
  course: string;
  semester: string;
  condition: BookCondition;
  listingType: ListingType;
  originalPrice: number | string;
  sellingPrice: number | string;
  exchangePreferences: string;
}

const CONDITION_OPTIONS: { value: BookCondition; label: string; desc: string }[] = [
  { value: 'New', label: 'Brand New', desc: 'Unopened, unread, in pristine mint condition.' },
  { value: 'Like New', label: 'Like New', desc: 'Read once, crisp cover, no highlights or wear.' },
  { value: 'Good', label: 'Good', desc: 'Light signs of use, minimal notes, clean binding.' },
  { value: 'Fair', label: 'Fair', desc: 'Noticeable wear or annotations, complete and readable.' },
  { value: 'Poor', label: 'Poor', desc: 'Heavy wear, dog-eared or damaged spine, fully intact text.' },
];

function SellBookWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const isEditing = Boolean(editId);

  const { user } = useAuth();

  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [priceSuggestion, setPriceSuggestion] = useState<SmartPriceSuggestion | null>(null);
  const [priceSuggestionLoading, setPriceSuggestionLoading] = useState(false);
  const [priceSuggestionError, setPriceSuggestionError] = useState('');

  // Reference data
  const [universities, setUniversities] = useState<University[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Images state
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<{ url: string; public_id?: string }[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState<BookFormData>({
    title: '',
    author: '',
    isbn: '',
    edition: '1st Edition',
    publisher: '',
    publicationYear: '',
    description: '',
    category: '',
    university: '',
    subject: '',
    course: '',
    semester: '',
    condition: 'Good',
    listingType: 'sell',
    originalPrice: '',
    sellingPrice: '',
    exchangePreferences: '',
  });

  // Step validation errors
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

  // 1. Fetch reference data and book details if editing
  useEffect(() => {
    async function init() {
      try {
        setLoadingData(true);
        const [uniRes, catRes] = await Promise.all([
          api.getUniversities(),
          api.getCategories(),
        ]);

        setUniversities(uniRes.universities || []);
        setCategories(catRes.categories || []);

        // Default university from user profile
        let userUniId = '';
        if (user?.university) {
          userUniId =
            typeof user.university === 'object' ? user.university._id : user.university;
        }

        // If editing, load book details
        if (editId) {
          const bookRes = await api.getBookById(editId);
          const book = bookRes.book;

          const catId = typeof book.category === 'object' ? book.category._id : book.category;
          const uniId = typeof book.university === 'object' ? book.university._id : book.university;

          setFormData({
            title: book.title || '',
            author: book.author || '',
            isbn: book.isbn || '',
            edition: book.edition || '1st Edition',
            publisher: book.publisher || '',
            publicationYear: book.publicationYear ? String(book.publicationYear) : '',
            description: book.description || '',
            category: catId || '',
            university: uniId || userUniId || '',
            subject: book.subject || '',
            course: book.course || '',
            semester: book.semester || '',
            condition: book.condition || 'Good',
            listingType: (book.listingType as ListingType) || 'sell',
            originalPrice: book.originalPrice !== undefined ? book.originalPrice : '',
            sellingPrice: book.sellingPrice !== undefined ? book.sellingPrice : '',
            exchangePreferences: book.exchangePreferences || '',
          });

          // Existing images
          if (Array.isArray(book.images)) {
            const normalized = book.images.map((img: any) =>
              typeof img === 'string' ? { url: img, public_id: '' } : img
            );
            setExistingImages(normalized);
          }
        } else {
          // Set initial defaults for new book
          setFormData((prev) => ({
            ...prev,
            university: userUniId || (uniRes.universities[0]?._id ?? ''),
            category: catRes.categories[0]?._id ?? '',
          }));
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to load setup data.');
      } finally {
        setLoadingData(false);
      }
    }

    init();
  }, [editId, user]);

  useEffect(() => {
    if (
      currentStep !== 4 ||
      formData.listingType !== 'sell' ||
      !formData.category ||
      Number(formData.originalPrice) <= 0
    ) {
      setPriceSuggestion(null);
      setPriceSuggestionError('');
      setPriceSuggestionLoading(false);
      return;
    }

    let active = true;
    setPriceSuggestionLoading(true);
    setPriceSuggestionError('');
    const timer = window.setTimeout(async () => {
      try {
        const response = await api.getSmartPriceSuggestion({
          category: formData.category,
          originalPrice: Number(formData.originalPrice),
          condition: formData.condition,
          edition: formData.edition,
          title: formData.title,
        });
        if (active) setPriceSuggestion(response);
      } catch (requestError) {
        if (active) {
          setPriceSuggestion(null);
          setPriceSuggestionError(
            requestError instanceof Error ? requestError.message : 'Unable to load a price suggestion.'
          );
        }
      } finally {
        if (active) setPriceSuggestionLoading(false);
      }
    }, 350);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [
    currentStep,
    formData.category,
    formData.condition,
    formData.edition,
    formData.listingType,
    formData.originalPrice,
    formData.title,
  ]);

  // Handle field change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      // Auto zero selling price for donations
      if (name === 'listingType' && value === 'donate') {
        next.sellingPrice = 0;
      }
      return next;
    });

    if (stepErrors[name]) {
      setStepErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  // Condition selector
  const handleConditionSelect = (cond: BookCondition) => {
    setFormData((prev) => ({ ...prev, condition: cond }));
  };

  // Listing type selector
  const handleListingTypeSelect = (type: ListingType) => {
    setFormData((prev) => ({
      ...prev,
      listingType: type,
      sellingPrice: type === 'donate' ? 0 : prev.sellingPrice,
    }));
  };

  // Image upload handling
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const totalExisting = existingImages.length - removedImageIds.length;
    const currentNewCount = newImageFiles.length;
    const availableSlots = 5 - (totalExisting + currentNewCount);

    if (availableSlots <= 0) {
      setErrorMsg('You can upload a maximum of 5 images in total.');
      return;
    }

    const validFiles: File[] = [];
    const validPreviews: string[] = [];

    Array.from(files).forEach((file) => {
      if (validFiles.length >= availableSlots) return;

      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      if (!allowedMimes.includes(file.type)) {
        setErrorMsg('Only JPG, PNG, and WebP images are supported.');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg(`File "${file.name}" exceeds the 5MB maximum size limit.`);
        return;
      }

      validFiles.push(file);
      validPreviews.push(URL.createObjectURL(file));
    });

    if (validFiles.length > 0) {
      setNewImageFiles((prev) => [...prev, ...validFiles]);
      setNewImagePreviews((prev) => [...prev, ...validPreviews]);
      setErrorMsg(null);
    }
  };

  const handleRemoveNewImage = (index: number) => {
    URL.revokeObjectURL(newImagePreviews[index]);
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingImage = (item: { url: string; public_id?: string }) => {
    const key = item.public_id || item.url;
    setRemovedImageIds((prev) => [...prev, key]);
  };

  const handleRestoreExistingImage = (item: { url: string; public_id?: string }) => {
    const key = item.public_id || item.url;
    setRemovedImageIds((prev) => prev.filter((k) => k !== key));
  };

  // Validate current step before proceeding
  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.title.trim() || formData.title.trim().length < 2) {
        errors.title = 'Title must be at least 2 characters.';
      }
      if (!formData.author.trim() || formData.author.trim().length < 2) {
        errors.author = 'Author name must be at least 2 characters.';
      }
      if (!formData.description.trim() || formData.description.trim().length < 10) {
        errors.description = 'Please provide a description of at least 10 characters.';
      }
    } else if (step === 2) {
      if (!formData.category) {
        errors.category = 'Please select a book category.';
      }
      if (!formData.university) {
        errors.university = 'Please select a university campus.';
      }
    } else if (step === 3) {
      // Images are optional, but if present must be within limits
      const totalImages = existingImages.length - removedImageIds.length + newImageFiles.length;
      if (totalImages > 5) {
        errors.images = 'A maximum of 5 images are allowed.';
      }
    } else if (step === 4) {
      const orig = Number(formData.originalPrice);
      const sell = Number(formData.sellingPrice);

      if (formData.originalPrice === '' || isNaN(orig) || orig < 0) {
        errors.originalPrice = 'Please enter a valid original price (0 or higher).';
      }

      if (formData.listingType === 'donate') {
        // Must be 0
        if (sell !== 0) {
          errors.sellingPrice = 'Price must be $0 for donation listings.';
        }
      } else {
        if (formData.sellingPrice === '' || isNaN(sell) || sell < 0) {
          errors.sellingPrice = 'Please enter a valid selling price.';
        } else if (sell > orig) {
          errors.sellingPrice = 'Selling price cannot exceed the original price.';
        }
      }

      if (!formData.condition) {
        errors.condition = 'Please select the physical condition of the book.';
      }
    }

    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setErrorMsg(null);
      setCurrentStep((prev) => Math.min(prev + 1, 5));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setErrorMsg(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Submit Listing
  const handleSubmit = async () => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(4)) {
      setErrorMsg('Please review previous steps to resolve all validation errors.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);

      const payload = new FormData();
      payload.append('title', formData.title.trim());
      payload.append('author', formData.author.trim());
      if (formData.isbn.trim()) payload.append('isbn', formData.isbn.trim());
      if (formData.edition.trim()) payload.append('edition', formData.edition.trim());
      if (formData.publisher.trim()) payload.append('publisher', formData.publisher.trim());
      if (formData.publicationYear) payload.append('publicationYear', formData.publicationYear);
      payload.append('description', formData.description.trim());
      payload.append('category', formData.category);
      payload.append('university', formData.university);
      if (formData.subject.trim()) payload.append('subject', formData.subject.trim());
      if (formData.course.trim()) payload.append('course', formData.course.trim());
      if (formData.semester.trim()) payload.append('semester', formData.semester.trim());
      payload.append('condition', formData.condition);
      payload.append('listingType', formData.listingType);
      payload.append('originalPrice', String(formData.originalPrice));
      payload.append(
        'sellingPrice',
        String(formData.listingType === 'donate' ? 0 : formData.sellingPrice)
      );
      if (formData.exchangePreferences.trim()) {
        payload.append('exchangePreferences', formData.exchangePreferences.trim());
      }

      // Append new files under 'images'
      newImageFiles.forEach((file) => {
        payload.append('images', file);
      });

      // If editing, include removed images list
      if (isEditing && removedImageIds.length > 0) {
        payload.append('removeImages', JSON.stringify(removedImageIds));
      }

      if (isEditing && editId) {
        await api.updateBook(editId, payload);
        setSuccessMsg('Book listing updated successfully! Redirecting...');
      } else {
        await api.createBook(payload);
        setSuccessMsg('Book listed successfully! Redirecting to your inventory...');
      }

      setTimeout(() => {
        router.push('/my-books');
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit book listing. Please try again.');
      setSubmitting(false);
    }
  };

  // Helper names
  const selectedUni = universities.find((u) => u._id === formData.university);
  const selectedCat = categories.find((c) => c._id === formData.category);

  if (loadingData) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-campus-600" />
        <p className="text-slate-600 font-medium">Preparing book listing studio...</p>
      </div>
    );
  }

  const steps = [
    { num: 1, title: 'Details', icon: BookOpen },
    { num: 2, title: 'Academic', icon: GraduationCap },
    { num: 3, title: 'Photos', icon: ImageIcon },
    { num: 4, title: 'Pricing', icon: DollarSign },
    { num: 5, title: 'Preview', icon: CheckCircle2 },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-campus-700 bg-campus-50 border border-campus-200 px-3 py-1 rounded-full w-fit mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          {isEditing ? 'Update Listing' : 'Student Textbook Marketplace'}
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {isEditing ? 'Edit Your Book Listing' : 'List a Textbook for Campus Students'}
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          {isEditing
            ? 'Update the details, adjust pricing, or refresh photo attachments.'
            : 'Pass down your study material to fellow students in 5 simple steps.'}
        </p>
      </div>

      {/* Progress Stepper */}
      <div className="mb-10 bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs">
        <div className="grid grid-cols-5 gap-2 sm:gap-4 relative">
          {steps.map((s) => {
            const Icon = s.icon;
            const isCompleted = currentStep > s.num;
            const isCurrent = currentStep === s.num;

            return (
              <button
                key={s.num}
                type="button"
                onClick={() => {
                  if (s.num < currentStep) {
                    setCurrentStep(s.num);
                  } else if (validateStep(currentStep)) {
                    setCurrentStep(s.num);
                  }
                }}
                className={`flex flex-col items-center text-center transition group ${
                  s.num <= currentStep ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                }`}
              >
                <div
                  className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center font-bold text-sm transition shadow-2xs ${
                    isCompleted
                      ? 'bg-campus-600 text-white'
                      : isCurrent
                      ? 'bg-campus-100 text-campus-800 ring-2 ring-campus-600 ring-offset-2'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {isCompleted ? <Check className="w-5 h-5 stroke-[2.5]" /> : <Icon className="w-5 h-5" />}
                </div>
                <span
                  className={`text-xs mt-2 font-medium hidden sm:block ${
                    isCurrent ? 'text-campus-900 font-bold' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                  }`}
                >
                  {s.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Alert Banners */}
      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-semibold">Attention: </span>
            {errorMsg}
          </div>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="text-sm font-semibold">{successMsg}</div>
        </div>
      )}

      {/* Wizard Step Forms */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
        {/* STEP 1: Details */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Step 1: Book Details</h2>
              <p className="text-sm text-slate-500 mt-1">
                Provide essential information so students can find and identify your textbook.
              </p>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Book Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Introduction to Algorithms (CLRS)"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-campus-500 ${
                    stepErrors.title ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                  }`}
                />
                {stepErrors.title && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{stepErrors.title}</p>
                )}
              </div>

              {/* Author */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Author(s) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleChange}
                  placeholder="e.g. Thomas H. Cormen, Charles E. Leiserson"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-campus-500 ${
                    stepErrors.author ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                  }`}
                />
                {stepErrors.author && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{stepErrors.author}</p>
                )}
              </div>

              {/* ISBN & Edition */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    ISBN (10 or 13 digits)
                  </label>
                  <input
                    type="text"
                    name="isbn"
                    value={formData.isbn}
                    onChange={handleChange}
                    placeholder="e.g. 9780262046305"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-campus-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Edition
                  </label>
                  <input
                    type="text"
                    name="edition"
                    value={formData.edition}
                    onChange={handleChange}
                    placeholder="e.g. 4th Edition"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-campus-500"
                  />
                </div>
              </div>

              {/* Publisher & Year */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Publisher (Optional)
                  </label>
                  <input
                    type="text"
                    name="publisher"
                    value={formData.publisher}
                    onChange={handleChange}
                    placeholder="e.g. MIT Press, Pearson, Wiley"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-campus-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Publication Year
                  </label>
                  <input
                    type="number"
                    name="publicationYear"
                    value={formData.publicationYear}
                    onChange={handleChange}
                    placeholder="e.g. 2022"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-campus-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Book Description <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-xs text-slate-400">
                    {formData.description.length} / 2500 (min 10)
                  </span>
                </div>
                <textarea
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your copy's highlights, binding condition, whether it includes study notes or CDs, and why it is great for this course..."
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-campus-500 ${
                    stepErrors.description ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                  }`}
                />
                {stepErrors.description && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">
                    {stepErrors.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Academic */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Step 2: Academic Context</h2>
              <p className="text-sm text-slate-500 mt-1">
                Help students from your university find books tailored for their specific syllabus.
              </p>
            </div>

            <div className="space-y-4">
              {/* University Campus */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  University / College <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="university"
                    value={formData.university}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-campus-500 ${
                      stepErrors.university ? 'border-rose-400' : 'border-slate-300'
                    }`}
                  >
                    <option value="">Select your campus</option>
                    {universities.map((uni) => (
                      <option key={uni._id} value={uni._id}>
                        {uni.name} ({uni.code}) - {uni.city}, {uni.state}
                      </option>
                    ))}
                  </select>
                </div>
                {stepErrors.university && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{stepErrors.university}</p>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Academic Category <span className="text-rose-500">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-campus-500 ${
                    stepErrors.category ? 'border-rose-400' : 'border-slate-300'
                  }`}
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {stepErrors.category && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{stepErrors.category}</p>
                )}
              </div>

              {/* Subject & Course Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Subject / Department
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="e.g. Data Structures & Algorithms"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-campus-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Course Code
                  </label>
                  <input
                    type="text"
                    name="course"
                    value={formData.course}
                    onChange={handleChange}
                    placeholder="e.g. CS 106B / 6.006"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-campus-500"
                  />
                </div>
              </div>

              {/* Semester / Term */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Semester / Academic Term
                </label>
                <input
                  type="text"
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  placeholder="e.g. Fall 2026, Spring Semester, 3rd Year"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-campus-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Images */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Step 3: Book Photos</h2>
              <p className="text-sm text-slate-500 mt-1">
                Upload clear photos of the book cover, spine, and inner sample pages (max 5 photos, 5MB each).
              </p>
            </div>

            {/* Drag and Drop Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleFileSelect(e.dataTransfer.files);
              }}
              className="border-2 border-dashed border-campus-300 hover:border-campus-500 bg-campus-50/40 hover:bg-campus-50/70 rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-3"
            >
              <div className="w-12 h-12 rounded-full bg-campus-100 text-campus-700 flex items-center justify-center shadow-xs">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  Click to select photos or drag and drop here
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supported formats: JPG, PNG, WEBP (Max 5MB each)
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
              />
            </div>

            {/* Previews Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>
                  Attached Images:{' '}
                  {existingImages.length - removedImageIds.length + newImageFiles.length} / 5
                </span>
                <span className="text-slate-400">First image will be the primary cover photo</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {/* Existing Images (Edit mode) */}
                {existingImages.map((img, idx) => {
                  const key = img.public_id || img.url;
                  const isRemoved = removedImageIds.includes(key);

                  return (
                    <div
                      key={`existing-${idx}`}
                      className={`relative aspect-3/4 rounded-xl overflow-hidden border ${
                        isRemoved
                          ? 'border-rose-300 opacity-40 bg-slate-100'
                          : 'border-slate-200 shadow-xs'
                      }`}
                    >
                      <img
                        src={img.url}
                        alt="Existing book attachment"
                        className="w-full h-full object-cover"
                      />
                      {idx === 0 && !isRemoved && (
                        <span className="absolute top-1 left-1 bg-campus-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                          Cover
                        </span>
                      )}
                      <div className="absolute top-1 right-1">
                        {isRemoved ? (
                          <button
                            type="button"
                            onClick={() => handleRestoreExistingImage(img)}
                            className="bg-slate-800 text-white p-1 rounded-md text-[10px] font-bold hover:bg-slate-900"
                            title="Undo Remove"
                          >
                            Restore
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRemoveExistingImage(img)}
                            className="bg-rose-600 hover:bg-rose-700 text-white p-1 rounded-md transition shadow-sm"
                            title="Remove image"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Newly Added Images */}
                {newImagePreviews.map((previewUrl, idx) => (
                  <div
                    key={`new-${idx}`}
                    className="relative aspect-3/4 rounded-xl overflow-hidden border border-campus-300 shadow-xs ring-2 ring-campus-500/20"
                  >
                    <img
                      src={previewUrl}
                      alt="New upload preview"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 left-1 bg-slate-900/80 text-white text-[9px] font-medium px-1.5 py-0.5 rounded">
                      {(newImageFiles[idx].size / 1024 / 1024).toFixed(1)} MB
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveNewImage(idx)}
                      className="absolute top-1 right-1 bg-rose-600 hover:bg-rose-700 text-white p-1 rounded-md transition shadow-sm"
                      title="Remove image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Pricing */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Step 4: Pricing & Condition</h2>
              <p className="text-sm text-slate-500 mt-1">
                Choose whether you want to sell, exchange, or donate this book to a peer.
              </p>
            </div>

            {/* Listing Type Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Listing Type <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    type: 'sell' as ListingType,
                    title: 'Sell for Cash',
                    desc: 'Set an affordable discounted price for students.',
                    badge: 'Direct Payment',
                  },
                  {
                    type: 'exchange' as ListingType,
                    title: 'Book Exchange',
                    desc: 'Swap with another textbook you need this semester.',
                    badge: 'Peer Barter',
                  },
                  {
                    type: 'donate' as ListingType,
                    title: 'Free Donation',
                    desc: 'Give freely to a junior student in need ($0 cost).',
                    badge: '100% Free Karma',
                  },
                ].map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => handleListingTypeSelect(item.type)}
                    className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
                      formData.listingType === item.type
                        ? 'border-campus-600 bg-campus-50/60 ring-2 ring-campus-600 ring-offset-1'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 inline-block mb-2">
                        {item.badge}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900">{item.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Condition Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Book Condition <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {CONDITION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleConditionSelect(opt.value)}
                    className={`p-3 rounded-xl border text-left transition ${
                      formData.condition === opt.value
                        ? 'border-campus-600 bg-campus-50/70 text-campus-900 ring-1 ring-campus-600'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                    }`}
                  >
                    <div className="font-bold text-xs">{opt.label}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      {opt.desc}
                    </div>
                  </button>
                ))}
              </div>
              {stepErrors.condition && (
                <p className="text-xs text-rose-600 mt-1 font-medium">{stepErrors.condition}</p>
              )}
            </div>

            {/* Price Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Original Price */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Original Retail Price ($) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-bold text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    name="originalPrice"
                    min="0"
                    step="0.01"
                    value={formData.originalPrice}
                    onChange={handleChange}
                    placeholder="e.g. 120.00"
                    className={`w-full pl-8 pr-4 py-2.5 rounded-xl border text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-campus-500 ${
                      stepErrors.originalPrice ? 'border-rose-400' : 'border-slate-300'
                    }`}
                  />
                </div>
                {stepErrors.originalPrice && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{stepErrors.originalPrice}</p>
                )}
              </div>

              {/* Selling Price */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Selling Price ($) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-bold text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    name="sellingPrice"
                    min="0"
                    step="0.01"
                    disabled={formData.listingType === 'donate'}
                    value={formData.listingType === 'donate' ? '0' : formData.sellingPrice}
                    onChange={handleChange}
                    placeholder="e.g. 45.00"
                    className={`w-full pl-8 pr-4 py-2.5 rounded-xl border text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-campus-500 ${
                      formData.listingType === 'donate' ? 'bg-slate-100 text-slate-500' : ''
                    } ${stepErrors.sellingPrice ? 'border-rose-400' : 'border-slate-300'}`}
                  />
                </div>
                {formData.listingType === 'donate' ? (
                  <p className="text-xs text-emerald-700 font-medium mt-1">
                    Free donation mode sets price to $0.00 automatically.
                  </p>
                ) : (
                  stepErrors.sellingPrice && (
                    <p className="text-xs text-rose-600 mt-1 font-medium">
                      {stepErrors.sellingPrice}
                    </p>
                  )
                )}
              </div>
            </div>

            {formData.listingType === 'sell' && Number(formData.originalPrice) > 0 && (
              <div className="rounded-2xl border border-campus-200 bg-gradient-to-r from-campus-50 to-emerald-50 p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-bold text-campus-900">
                      <Sparkles className="h-4 w-4 text-campus-600" />
                      Suggested price
                    </p>
                    {priceSuggestionLoading ? (
                      <div className="mt-3 h-5 w-56 animate-pulse rounded bg-campus-100" />
                    ) : priceSuggestion ? (
                      <>
                        <p className="mt-2 text-2xl font-extrabold text-slate-900">
                          ${priceSuggestion.suggested.toFixed(2)}
                          <span className="ml-2 text-xs font-medium text-slate-500">
                            range ${priceSuggestion.min.toFixed(2)}–${priceSuggestion.max.toFixed(2)}
                          </span>
                        </p>
                        <p className="mt-1 text-xs text-slate-600">
                          Based on {priceSuggestion.basedOn}
                          {priceSuggestion.sampleSize > 0 && ` · ${priceSuggestion.sampleSize} comparable listing${priceSuggestion.sampleSize === 1 ? '' : 's'}`}
                        </p>
                      </>
                    ) : priceSuggestionError ? (
                      <p role="status" className="mt-2 text-xs text-rose-700">{priceSuggestionError}</p>
                    ) : (
                      <p className="mt-2 text-xs text-slate-600">Add a title, category, condition, and original price to get a market estimate.</p>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={!priceSuggestion || priceSuggestionLoading}
                    onClick={() => {
                      if (priceSuggestion) {
                        setFormData((previous) => ({
                          ...previous,
                          sellingPrice: priceSuggestion.suggested,
                        }));
                        setStepErrors((previous) => {
                          const next = { ...previous };
                          delete next.sellingPrice;
                          return next;
                        });
                      }
                    }}
                    className="shrink-0 rounded-xl bg-campus-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-campus-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Apply suggestion
                  </button>
                </div>
              </div>
            )}

            {/* Savings Indicator */}
            {formData.listingType === 'sell' &&
              Number(formData.originalPrice) > 0 &&
              Number(formData.sellingPrice) >= 0 &&
              Number(formData.sellingPrice) <= Number(formData.originalPrice) && (
                <div className="p-3 bg-campus-50 border border-campus-200 rounded-xl flex items-center justify-between text-xs font-medium text-campus-900">
                  <span className="flex items-center gap-1.5">
                    <BadgePercent className="w-4 h-4 text-campus-700" />
                    Student Discount Savings:
                  </span>
                  <span className="font-bold text-campus-800">
                    {Math.round(
                      ((Number(formData.originalPrice) - Number(formData.sellingPrice)) /
                        Number(formData.originalPrice)) *
                        100
                    )}
                    % OFF (You save fellow students $
                    {(Number(formData.originalPrice) - Number(formData.sellingPrice)).toFixed(2)})
                  </span>
                </div>
              )}

            {/* Exchange preferences notes */}
            {formData.listingType === 'exchange' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Exchange Preferences (What books or notes are you looking for?)
                </label>
                <textarea
                  name="exchangePreferences"
                  rows={2}
                  value={formData.exchangePreferences}
                  onChange={handleChange}
                  placeholder="e.g. Looking for Computer Architecture by Hennessy & Patterson, or Organic Chemistry 8th edition..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-campus-500"
                />
              </div>
            )}
          </div>
        )}

        {/* STEP 5: Preview & Submit */}
        {currentStep === 5 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Step 5: Review & Confirm</h2>
              <p className="text-sm text-slate-500 mt-1">
                Please double check all the details below before publishing your listing.
              </p>
            </div>

            {/* Book Card Preview */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50 p-6 flex flex-col md:flex-row gap-6 shadow-xs">
              {/* Photo Preview */}
              <div className="w-full md:w-48 h-64 shrink-0 rounded-xl overflow-hidden bg-slate-200 border border-slate-200 flex items-center justify-center">
                {newImagePreviews[0] ? (
                  <img
                    src={newImagePreviews[0]}
                    alt={formData.title}
                    className="w-full h-full object-cover"
                  />
                ) : existingImages.find((img) => !removedImageIds.includes(img.public_id || img.url)) ? (
                  <img
                    src={
                      existingImages.find(
                        (img) => !removedImageIds.includes(img.public_id || img.url)
                      )?.url
                    }
                    alt={formData.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-4 text-slate-400">
                    <BookOpen className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <span className="text-xs">No cover photo attached</span>
                  </div>
                )}
              </div>

              {/* Text Summary */}
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-campus-100 text-campus-800 mb-1.5">
                      {selectedCat?.name || 'General Category'}
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 leading-snug">
                      {formData.title || 'Untitled Book'}
                    </h3>
                    <p className="text-sm text-slate-600 mt-0.5 font-medium">
                      By {formData.author || 'Unknown Author'} ({formData.edition || '1st Edition'})
                    </p>
                  </div>

                  {/* Price Tag */}
                  <div className="text-right shrink-0">
                    {formData.listingType === 'donate' ? (
                      <span className="text-lg font-extrabold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                        FREE
                      </span>
                    ) : formData.listingType === 'exchange' ? (
                      <span className="text-lg font-extrabold text-amber-600 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200">
                        EXCHANGE
                      </span>
                    ) : (
                      <div>
                        <div className="text-2xl font-black text-campus-700">
                          ${Number(formData.sellingPrice || 0).toFixed(2)}
                        </div>
                        {Number(formData.originalPrice) > 0 && (
                          <div className="text-xs text-slate-400 line-through">
                            ${Number(formData.originalPrice).toFixed(2)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Badges Bar */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700">
                    Condition: <strong className="text-slate-900">{formData.condition}</strong>
                  </span>
                  {formData.course && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700">
                      Course: <strong className="text-slate-900">{formData.course}</strong>
                    </span>
                  )}
                  {selectedUni && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700">
                      Campus: <strong className="text-slate-900">{selectedUni.name}</strong>
                    </span>
                  )}
                </div>

                {/* Description Preview */}
                <div className="pt-2 border-t border-slate-200">
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Description:
                  </p>
                  <p className="text-sm text-slate-600 whitespace-pre-line line-clamp-3">
                    {formData.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Note on Pending Review */}
            <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-2xl flex items-start gap-3 text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Campus Verification Policy: </span>
                {isEditing
                  ? 'Your updated details will be saved immediately to your inventory.'
                  : 'New listings default to pending review to maintain textbook quality and safety across our campus community.'}
              </div>
            </div>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handleBack}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous Step
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {currentStep < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 bg-campus-600 hover:bg-campus-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition"
              >
                Next Step
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-2 bg-campus-600 hover:bg-campus-700 disabled:bg-campus-400 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isEditing ? 'Saving Updates...' : 'Publishing Listing...'}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    {isEditing ? 'Save Book Changes' : 'Publish Book Listing'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SellPage() {
  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-campus-600" />
            <p className="text-slate-500 text-sm">Loading Sell Studio...</p>
          </div>
        }
      >
        <SellBookWizard />
      </Suspense>
    </ProtectedRoute>
  );
}
