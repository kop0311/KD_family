/**
 * 表单验证工具函数
 */

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

/**
 * 验证邮箱格式
 */
export const validateEmail = (email: string): ValidationResult => {
  if (!email) {
    return { isValid: false, message: '邮箱不能为空' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, message: '请输入有效的邮箱地址' };
  }

  return { isValid: true };
};

/**
 * 验证用户名
 */
export const validateUsername = (username: string): ValidationResult => {
  if (!username) {
    return { isValid: false, message: '用户名不能为空' };
  }

  if (username.length < 3) {
    return { isValid: false, message: '用户名至少需要3个字符' };
  }

  if (username.length > 20) {
    return { isValid: false, message: '用户名不能超过20个字符' };
  }

  const usernameRegex = /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/;
  if (!usernameRegex.test(username)) {
    return { isValid: false, message: '用户名只能包含字母、数字、下划线和中文' };
  }

  return { isValid: true };
};

/**
 * 验证密码强度
 */
export const validatePassword = (password: string): ValidationResult => {
  if (!password) {
    return { isValid: false, message: '密码不能为空' };
  }

  if (password.length < 6) {
    return { isValid: false, message: '密码至少需要6个字符' };
  }

  if (password.length > 50) {
    return { isValid: false, message: '密码不能超过50个字符' };
  }

  // 检查密码强度（至少包含字母和数字）
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);

  if (!hasLetter || !hasNumber) {
    return { isValid: false, message: '密码必须包含至少一个字母和一个数字' };
  }

  return { isValid: true };
};

/**
 * 验证确认密码
 */
export const validateConfirmPassword = (password: string, confirmPassword: string): ValidationResult => {
  if (!confirmPassword) {
    return { isValid: false, message: '请确认密码' };
  }

  if (password !== confirmPassword) {
    return { isValid: false, message: '两次输入的密码不一致' };
  }

  return { isValid: true };
};

/**
 * 验证全名
 */
export const validateFullName = (fullName: string): ValidationResult => {
  if (!fullName) {
    return { isValid: false, message: '姓名不能为空' };
  }

  if (fullName.length < 2) {
    return { isValid: false, message: '姓名至少需要2个字符' };
  }

  if (fullName.length > 50) {
    return { isValid: false, message: '姓名不能超过50个字符' };
  }

  return { isValid: true };
};

/**
 * 验证任务标题
 */
export const validateTaskTitle = (title: string): ValidationResult => {
  if (!title) {
    return { isValid: false, message: '任务标题不能为空' };
  }

  if (title.length < 2) {
    return { isValid: false, message: '任务标题至少需要2个字符' };
  }

  if (title.length > 100) {
    return { isValid: false, message: '任务标题不能超过100个字符' };
  }

  return { isValid: true };
};

/**
 * 验证任务描述
 */
export const validateTaskDescription = (description: string): ValidationResult => {
  if (!description) {
    return { isValid: false, message: '任务描述不能为空' };
  }

  if (description.length < 10) {
    return { isValid: false, message: '任务描述至少需要10个字符' };
  }

  if (description.length > 1000) {
    return { isValid: false, message: '任务描述不能超过1000个字符' };
  }

  return { isValid: true };
};

/**
 * 验证积分值
 */
export const validatePoints = (points: number): ValidationResult => {
  if (points === undefined || points === null) {
    return { isValid: false, message: '积分值不能为空' };
  }

  if (points < 1) {
    return { isValid: false, message: '积分值必须大于0' };
  }

  if (points > 1000) {
    return { isValid: false, message: '积分值不能超过1000' };
  }

  return { isValid: true };
};

/**
 * 验证日期
 */
export const validateDate = (date: string | Date): ValidationResult => {
  if (!date) {
    return { isValid: false, message: '日期不能为空' };
  }

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return { isValid: false, message: '请输入有效的日期' };
  }

  const now = new Date();
  if (dateObj < now) {
    return { isValid: false, message: '日期不能早于当前时间' };
  }

  return { isValid: true };
};

/**
 * 批量验证表单字段
 */
export const validateForm = (fields: { [key: string]: any }, validators: { [key: string]: (value: any) => ValidationResult }): { isValid: boolean; errors: { [key: string]: string } } => {
  const errors: { [key: string]: string } = {};
  let isValid = true;

  for (const [fieldName, validator] of Object.entries(validators)) {
    const fieldValue = fields[fieldName];
    const result = validator(fieldValue);
    
    if (!result.isValid) {
      errors[fieldName] = result.message || '验证失败';
      isValid = false;
    }
  }

  return { isValid, errors };
};

/**
 * 实时验证Hook使用的验证函数
 */
export const createFieldValidator = (validator: (value: any) => ValidationResult) => {
  return (value: any) => {
    const result = validator(value);
    return result.isValid ? null : result.message;
  };
};
