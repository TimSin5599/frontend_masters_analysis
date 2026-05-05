const usersFields = {
  id: { type: 'id', label: 'ID' },

  firstName: { type: 'string', label: 'Имя', required: true },

  lastName: { type: 'string', label: 'Фамилия', required: true },

  phoneNumber: { type: 'string', label: 'Телефон' },

  email: { type: 'string', label: 'Email', required: true },

  roles: {
    type: 'stringArray',
    label: 'Роли',
    required: true,
    options: [
      { value: 'admin',   label: 'Администратор' },
      { value: 'manager', label: 'Менеджер' },
      { value: 'expert',  label: 'Эксперт' },
    ],
  },

  password: { type: 'string', label: 'Пароль', required: true },
};

export default usersFields;
