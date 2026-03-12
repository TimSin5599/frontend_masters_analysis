import { Box, Card, CardActionArea, CardContent, CircularProgress, Grid, Typography } from "@mui/material";
import axios from "axios";
import MUIDataTable from "mui-datatables";
import { useEffect, useState } from "react";
import PageTitle from "../../components/PageTitle/PageTitle";
import { Button } from "../../components/Wrappers/Wrappers";
import config from "../../config";

export default function ProgramsPage({ defaultView }) {
    const [programs, setPrograms] = useState([]);
    const [view, setView] = useState(defaultView || "applicants"); // 'applicants' or 'archive'
    const [currentProgram, setCurrentProgram] = useState(null);
    const [applicants, setApplicants] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (defaultView) {
            setView(defaultView === "current" ? "applicants" : "archive");
        }
    }, [defaultView]);

    useEffect(() => {
        axios.get(`${config.manageApi}/v1/programs`)
            .then(res => {
                const sorted = res.data.sort((a, b) => b.year - a.year);
                setPrograms(sorted);
                if (sorted.length > 0) {
                    setCurrentProgram(sorted[0]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        if (currentProgram && view === "applicants") {
            setLoading(true);
            axios.get(`${config.manageApi}/v1/applicants?program_id=${currentProgram.id}`)
                .then(res => {
                    setApplicants(res.data || []);
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                });
        }
    }, [currentProgram, view]);

    const statusMap = {
        "uploaded": "Создан",
        "processing": "Загрузка",
        "verifying": "Проверка",
        "assessed": "Оценивание",
        "completed": "Завершен"
    };

    const columns = [
        {
            name: "id",
            label: "ID",
            options: { display: false, filter: false }
        },
        {
            name: "place",
            label: "Место",
            options: {
                customBodyRender: (value, tableMeta) => tableMeta.rowIndex + 1
            }
        },
        { name: "last_name", label: "Фамилия" },
        { name: "first_name", label: "Имя" },
        { name: "patronymic", label: "Отчество" },
        {
            name: "score",
            label: "Оценка",
            options: {
                customBodyRender: (value) => (value && value !== 0 && value !== "0.0") ? value : "-"
            }
        },
        {
            name: "status",
            label: "Статус",
            options: {
                customBodyRender: (value) => statusMap[value] || value
            }
        },
        {
            name: "actions",
            label: "Действия",
            options: {
                customBodyRender: (value, tableMeta) => {
                    const id = tableMeta.rowData[0];
                    return (
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={() => window.location.hash = `#/app/applicants/${id}?program_id=${currentProgram.id}`}
                        >
                            Анализ
                        </Button>
                    );
                }
            }
        }
    ];

    if (loading && programs.length === 0) {
        return <Box display="flex" justifyContent="center" alignItems="center" height="50vh"><CircularProgress /></Box>;
    }

    return (
        <>
            <PageTitle
                title="Системная и программная инженерия"
                actions={
                    view === "applicants" && (
                        <Button
                            variant="outlined"
                            color="secondary"
                            onClick={() => {
                                const link = currentProgram
                                    ? `#/app/applicants/new?program_id=${currentProgram.id}`
                                    : "#/app/applicants/new";
                                window.location.hash = link;
                            }}
                        >
                            Добавить абитуриента
                        </Button>
                    )
                }
            />

            {view === "applicants" && currentProgram ? (
                <Box mt={2}>
                    <Typography variant="h5" gutterBottom color="textSecondary">
                        Приемная кампания {currentProgram.year}
                    </Typography>
                    <Grid container spacing={4} mt={1}>
                        <Grid item xs={12}>
                            <MUIDataTable
                                title={`Список абитуриентов (${currentProgram.year})`}
                                data={applicants}
                                columns={columns}
                                options={{
                                    filterType: "checkbox",
                                    selectableRows: 'none',
                                    onRowClick: (rowData) => {
                                        window.location.hash = `#/app/applicants/${rowData[0]}?program_id=${currentProgram.id}`;
                                    }
                                }}
                            />
                        </Grid>
                    </Grid>
                </Box>
            ) : (
                <Box mt={2}>
                    <Typography variant="h5" gutterBottom color="textSecondary">
                        Архив наборов
                    </Typography>
                    <Grid container spacing={4} mt={1}>
                        {programs.map(program => (
                            <Grid item xs={12} md={4} key={program.id}>
                                <Card elevation={3} style={{ borderRadius: 15 }}>
                                    <CardActionArea onClick={() => {
                                        setCurrentProgram(program);
                                        setView("applicants");
                                    }}>
                                        <CardContent style={{ height: 180, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
                                            <Box mb={1} bgcolor="primary.light" color="white" display="inline-block" p={1} borderRadius={2} alignSelf="center">
                                                <Typography variant="h6">{program.year}</Typography>
                                            </Box>
                                            <Typography variant="h5" color="primary" weight="bold">
                                                {program.title}
                                            </Typography>
                                            <Box mt={2}>
                                                <Typography color="textSecondary" variant="body2">
                                                    {program.description}
                                                </Typography>
                                            </Box>
                                        </CardContent>
                                    </CardActionArea>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}
        </>
    );
}
