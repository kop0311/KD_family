import { renderHook, act } from '@testing-library/react';
import { useForm } from '../useForm';
import { validateEmail, validatePassword } from '@/utils/validation';

describe('useForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('应该初始化表单状态', () => {
    const { result } = renderHook(() =>
      useForm({
        initialValues: { email: '', password: '' },
        onSubmit: mockOnSubmit
      })
    );

    expect(result.current.values).toEqual({ email: '', password: '' });
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
    expect(result.current.isValid).toBe(true);
    expect(result.current.isSubmitting).toBe(false);
  });

  it('应该更新字段值', () => {
    const { result } = renderHook(() =>
      useForm({
        initialValues: { email: '', password: '' },
        onSubmit: mockOnSubmit
      })
    );

    act(() => {
      result.current.setValue('email', 'test@example.com');
    });

    expect(result.current.values.email).toBe('test@example.com');
  });

  it('应该处理字段变更', () => {
    const { result } = renderHook(() =>
      useForm({
        initialValues: { email: '', password: '' },
        onSubmit: mockOnSubmit
      })
    );

    act(() => {
      result.current.handleChange('email')('test@example.com');
    });

    expect(result.current.values.email).toBe('test@example.com');
  });

  it('应该验证字段', () => {
    const { result } = renderHook(() =>
      useForm({
        initialValues: { email: '', password: '' },
        validators: {
          email: validateEmail,
          password: validatePassword
        },
        onSubmit: mockOnSubmit
      })
    );

    act(() => {
      result.current.setValue('email', 'invalid-email');
      result.current.setTouched('email', true);
    });

    act(() => {
      result.current.validateField('email');
    });

    expect(result.current.errors.email).toBe('请输入有效的邮箱地址');
    expect(result.current.isValid).toBe(false);
  });

  it('应该在字段失焦时验证', () => {
    const { result } = renderHook(() =>
      useForm({
        initialValues: { email: '', password: '' },
        validators: {
          email: validateEmail
        },
        onSubmit: mockOnSubmit
      })
    );

    act(() => {
      result.current.setValue('email', 'invalid-email');
    });

    act(() => {
      result.current.handleBlur('email')();
    });

    expect(result.current.touched.email).toBe(true);
    expect(result.current.errors.email).toBe('请输入有效的邮箱地址');
  });

  it('应该验证整个表单', () => {
    const { result } = renderHook(() =>
      useForm({
        initialValues: { email: '', password: '' },
        validators: {
          email: validateEmail,
          password: validatePassword
        },
        onSubmit: mockOnSubmit
      })
    );

    act(() => {
      result.current.setValue('email', 'invalid-email');
      result.current.setValue('password', '123');
    });

    let isValid: boolean;
    act(() => {
      isValid = result.current.validateForm();
    });

    expect(isValid!).toBe(false);
    expect(result.current.errors.email).toBe('请输入有效的邮箱地址');
    expect(result.current.errors.password).toBe('密码必须包含至少一个字母和一个数字');
  });

  it('应该处理表单提交', async () => {
    const { result } = renderHook(() =>
      useForm({
        initialValues: { email: '', password: '' },
        validators: {
          email: validateEmail,
          password: validatePassword
        },
        onSubmit: mockOnSubmit
      })
    );

    act(() => {
      result.current.setValue('email', 'test@example.com');
      result.current.setValue('password', 'password123');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mockOnSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
  });

  it('应该在提交无效表单时不调用onSubmit', async () => {
    const { result } = renderHook(() =>
      useForm({
        initialValues: { email: '', password: '' },
        validators: {
          email: validateEmail,
          password: validatePassword
        },
        onSubmit: mockOnSubmit
      })
    );

    act(() => {
      result.current.setValue('email', 'invalid-email');
      result.current.setValue('password', '123');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
    expect(result.current.errors.email).toBe('请输入有效的邮箱地址');
    expect(result.current.errors.password).toBe('密码必须包含至少一个字母和一个数字');
  });

  it('应该设置和清除错误', () => {
    const { result } = renderHook(() =>
      useForm({
        initialValues: { email: '', password: '' },
        onSubmit: mockOnSubmit
      })
    );

    act(() => {
      result.current.setError('email', '自定义错误');
    });

    expect(result.current.errors.email).toBe('自定义错误');

    act(() => {
      result.current.clearError('email');
    });

    expect(result.current.errors.email).toBeUndefined();
  });

  it('应该清除所有错误', () => {
    const { result } = renderHook(() =>
      useForm({
        initialValues: { email: '', password: '' },
        onSubmit: mockOnSubmit
      })
    );

    act(() => {
      result.current.setError('email', '邮箱错误');
      result.current.setError('password', '密码错误');
    });

    expect(result.current.errors.email).toBe('邮箱错误');
    expect(result.current.errors.password).toBe('密码错误');

    act(() => {
      result.current.clearErrors();
    });

    expect(result.current.errors).toEqual({});
  });

  it('应该重置表单', () => {
    const initialValues = { email: '', password: '' };
    const { result } = renderHook(() =>
      useForm({
        initialValues,
        onSubmit: mockOnSubmit
      })
    );

    act(() => {
      result.current.setValue('email', 'test@example.com');
      result.current.setError('email', '错误信息');
      result.current.setTouched('email', true);
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
    expect(result.current.isSubmitting).toBe(false);
  });

  it('应该在提交时设置isSubmitting状态', async () => {
    const slowOnSubmit = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    const { result } = renderHook(() =>
      useForm({
        initialValues: { email: 'test@example.com', password: 'password123' },
        validators: {
          email: validateEmail,
          password: validatePassword
        },
        onSubmit: slowOnSubmit
      })
    );

    const submitPromise = act(async () => {
      await result.current.handleSubmit();
    });

    // 在提交过程中应该是loading状态
    expect(result.current.isSubmitting).toBe(true);

    await submitPromise;

    // 提交完成后应该不再是loading状态
    expect(result.current.isSubmitting).toBe(false);
  });

  it('应该处理提交时的错误', async () => {
    const errorOnSubmit = jest.fn(() => Promise.reject(new Error('提交失败')));
    
    const { result } = renderHook(() =>
      useForm({
        initialValues: { email: 'test@example.com', password: 'password123' },
        validators: {
          email: validateEmail,
          password: validatePassword
        },
        onSubmit: errorOnSubmit
      })
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.isSubmitting).toBe(false);
    expect(errorOnSubmit).toHaveBeenCalled();
  });
});
