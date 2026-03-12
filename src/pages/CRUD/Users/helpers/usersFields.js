const usersFields = {
  id: { type: 'id', label: 'ID' },

  firstName: { type: 'string', label: 'First Name', required: true },

  lastName: { type: 'string', label: 'Last Name', required: true },

  phoneNumber: { type: 'string', label: 'Phone Number' },

  email: { type: 'string', label: 'E-Mail', required: true },

  role: {
    type: 'enum',
    label: 'Role',
    required: true,

    options: [
      { value: 'admin', label: 'Admin' },
      { value: 'manager', label: 'Manager' },
      { value: 'expert', label: 'Expert' },
      { value: 'operator', label: 'Operator' },
    ],
  },

  avatar: { type: 'images', label: 'Avatar' },

  password: { type: 'string', label: 'Password', required: true },

  emailVerified: { type: 'boolean', label: 'Email Verified' },

  emailVerificationToken: { type: 'string', label: 'Email Verification Token' },

  emailVerificationTokenExpiresAt: {
    type: 'datetime',
    label: 'Email Verification Token Expires At',
  },

  passwordResetToken: { type: 'string', label: 'Password Reset Token' },

  passwordResetTokenExpiresAt: {
    type: 'datetime',
    label: 'Password Reset Token Expires At',
  },

  provider: { type: 'string', label: 'Provider' },
};

export default usersFields;
