export const VALIDATION = {
  EMAIL: {
    LENGTH: {
      MIN: 3,
      MAX: 50,
    },
    NULLABLE_MESSAGE: 'Email не должен быть пустым',
    STRING_MESSAGE: 'Email должен быть строкой',
    VALIDATION_MESSAGE: 'Email должен быть в формате name@example.com',
  },
  PASSWORD: {
    LENGTH: {
      MIN: 8,
      MAX: 100,
    },
    REGEXP: `^(?=.*[a-zA-Z])(?=.*[~!?@#$%^&*_\\-+()\\[\\]{}<>\\/\\\\|"'.,:])[a-zA-Z0-9~!?@#$%^&*_\\-+()\\[\\]{}<>\\/\\\\|"'.,:]*$`,
    NULLABLE_MESSAGE: 'Пароль не должен быть пустым',
    STRING_MESSAGE: 'Пароль должен быть строкой',
    MIN_LENGTH_MESSAGE: `Пароль должен быть не короче ${8} символов`,
    MAX_LENGTH_MESSAGE: `Пароль должен быть не длиннее ${100} символов`,
    VALIDATION_MESSAGE:
      'Пароль должен быть от 8 до 100 символов, содержать только латинские буквы, цифры от (0-9) и хотя бы один специальный символ.',
  },
  CONFIRM_PASSWORD: {
    NULLABLE_MESSAGE: 'Подтверждение пароля не должно быть пустым',
    STRING_MESSAGE: 'Подтверждение пароля должно быть строкой',
    VALIDATION_MESSAGE: 'Пароли не совпадают',
  },

  NAME: {
    LENGTH: {
      MIN: 2,
      MAX: 100,
    },
    MIN_LENGTH_MESSAGE: `Имя должно быть не короче ${2} символов`,
    MAX_LENGTH_MESSAGE: `Имя должно быть не длиннее ${100} символов`,
    STRING_MESSAGE: 'Имя должно быть строкой',
  },

  LOGIN: {
    ERROR_MESSAGE: 'Неверные учетные данные',
  },
};
