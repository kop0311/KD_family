import { useState, useCallback, useMemo } from 'react';
import { ValidationResult } from '@/utils/validation';

export interface FormField {
  value: any;
  error?: string;
  touched: boolean;
  validator?: (value: any) => ValidationResult;
}

export interface FormConfig<T> {
  initialValues: T;
  validators?: Partial<Record<keyof T, (value: any) => ValidationResult>>;
  onSubmit?: (values: T) => void | Promise<void>;
}

export interface UseFormReturn<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isSubmitting: boolean;
  setValue: (field: keyof T, value: any) => void;
  setError: (field: keyof T, error: string) => void;
  clearError: (field: keyof T) => void;
  clearErrors: () => void;
  setTouched: (field: keyof T, touched?: boolean) => void;
  handleChange: (field: keyof T) => (value: any) => void;
  handleBlur: (field: keyof T) => () => void;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  reset: () => void;
  validateField: (field: keyof T) => boolean;
  validateForm: () => boolean;
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  validators = {},
  onSubmit
}: FormConfig<T>): UseFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouchedState] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 设置字段值
  const setValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    
    // 如果字段已被触摸，立即验证
    if (touched[field]) {
      const validator = validators[field];
      if (validator) {
        const result = validator(value);
        if (!result.isValid) {
          setErrors(prev => ({ ...prev, [field]: result.message }));
        } else {
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[field];
            return newErrors;
          });
        }
      }
    }
  }, [validators, touched]);

  // 设置错误
  const setError = useCallback((field: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  // 清除单个字段错误
  const clearError = useCallback((field: keyof T) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  // 清除所有错误
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  // 设置字段触摸状态
  const setTouched = useCallback((field: keyof T, touchedValue = true) => {
    setTouchedState(prev => ({ ...prev, [field]: touchedValue }));
  }, []);

  // 验证单个字段
  const validateField = useCallback((field: keyof T): boolean => {
    const validator = validators[field];
    if (!validator) return true;

    const result = validator(values[field]);
    if (!result.isValid) {
      setError(field, result.message || '验证失败');
      return false;
    } else {
      clearError(field);
      return true;
    }
  }, [values, validators, setError, clearError]);

  // 验证整个表单
  const validateForm = useCallback(): boolean => {
    let isFormValid = true;
    const newErrors: Partial<Record<keyof T, string>> = {};

    for (const field in validators) {
      const validator = validators[field];
      if (validator) {
        const result = validator(values[field]);
        if (!result.isValid) {
          newErrors[field] = result.message || '验证失败';
          isFormValid = false;
        }
      }
    }

    setErrors(newErrors);
    return isFormValid;
  }, [values, validators]);

  // 处理字段变化
  const handleChange = useCallback((field: keyof T) => (value: any) => {
    setValue(field, value);
  }, [setValue]);

  // 处理字段失焦
  const handleBlur = useCallback((field: keyof T) => () => {
    setTouched(field, true);
    validateField(field);
  }, [setTouched, validateField]);

  // 处理表单提交
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    // 标记所有字段为已触摸
    const allTouched: Partial<Record<keyof T, boolean>> = {};
    for (const field in initialValues) {
      allTouched[field] = true;
    }
    setTouchedState(allTouched);

    // 验证表单
    if (!validateForm()) {
      return;
    }

    if (onSubmit) {
      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Form submission error:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [values, validateForm, onSubmit, initialValues]);

  // 重置表单
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouchedState({});
    setIsSubmitting(false);
  }, [initialValues]);

  // 计算表单是否有效
  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  return {
    values,
    errors,
    touched,
    isValid,
    isSubmitting,
    setValue,
    setError,
    clearError,
    clearErrors,
    setTouched,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    validateField,
    validateForm
  };
}

// 表单字段Hook
export function useFormField<T>(
  form: UseFormReturn<T>,
  fieldName: keyof T,
  validator?: (value: any) => ValidationResult
) {
  return {
    value: form.values[fieldName],
    error: form.errors[fieldName],
    touched: form.touched[fieldName],
    onChange: form.handleChange(fieldName),
    onBlur: form.handleBlur(fieldName),
    validator: validator ? (value: any) => {
      const result = validator(value);
      return result.isValid ? null : result.message;
    } : undefined
  };
}
