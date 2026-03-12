import {
  History as ArchiveIcon,
  Event as EventIcon,
  Home as HomeIcon,
  People as PeopleIcon,
  School as ProgramsIcon,
} from '@mui/icons-material';

const structure = [
  {
    id: 300,
    label: 'Образовательная программа',
    link: '/app/programs',
    icon: <ProgramsIcon />,
    children: [
      { label: 'Текущий год', link: '/app/programs/current', icon: <EventIcon /> },
      { label: 'Архив', link: '/app/programs/archive', icon: <ArchiveIcon /> },
    ],
  },
  { id: 400, label: 'Пользователи', link: '/app/users', icon: <PeopleIcon /> },
  { id: 0, label: 'Дашборд', link: '/app/dashboard', icon: <HomeIcon /> },
];

export default structure;
