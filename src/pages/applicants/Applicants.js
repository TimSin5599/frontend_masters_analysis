import { Grid, createTheme, ThemeProvider } from "@mui/material";
import axios from "axios";
import MUIDataTable from "mui-datatables";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import config from "../../config";

// components
import PageTitle from "../../components/PageTitle/PageTitle";
import { StatusChip, CustomFilterList, StatusLegend, statusMap } from "./components/StatusComponents";
import ApplicantTableFilter from "./components/ApplicantTableFilter";
import { useUserState } from "../../context/UserContext";
import { hasRole } from "../../utils/roles";

export default function ApplicantsPage() {
    const [applicants, setApplicants] = useState([]);
    const { programId } = useParams();
    const { currentUser } = useUserState();

    const fetchApplicants = useCallback(() => {
        const url = programId
            ? `${config.manageApi}/v1/applicants?program_id=${programId}`
            : `${config.manageApi}/v1/applicants`;

        axios.get(url)
            .then(res => {
                setApplicants(res.data || []);
            })
            .catch(err => console.error(err));
    }, [programId]);

    useEffect(() => {
        fetchApplicants();
    }, [fetchApplicants]);

    const columns = [
        {
            name: "id",
            label: "ID",
            options: {
                display: false,
                filter: false,
            }
        },
        {
            name: "place",
            label: "Место",
            options: {
                customBodyRender: (value, tableMeta) => {
                    return tableMeta.rowIndex + 1;
                }
            }
        },
        {
            name: "last_name",
            label: "Фамилия",
            options: { filter: false }
        },
        { 
            name: "first_name", 
            label: "Имя",
            options: { filter: false }
        },
        { 
            name: "patronymic", 
            label: "Отчество",
            options: { filter: false }
        },
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
                filterOptions: {
                    renderValue: (v) => statusMap[v]?.label || v
                },
                customBodyRender: (value) => <StatusChip status={value} />
            }
        },
        {
            name: "created_at",
            label: "Дата создания",
            options: {
                filter: false,
                customBodyRender: (value) => {
                    const date = new Date(value);
                    const day = String(date.getDate()).padStart(2, '0');
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const year = String(date.getFullYear()).slice(-2);
                    const hours = String(date.getHours()).padStart(2, '0');
                    const minutes = String(date.getMinutes()).padStart(2, '0');
                    return `${day}.${month}.${year} ${hours}:${minutes}`;
                }
            }
        }
    ];


    const getMuiTheme = () => createTheme({
        components: {
            MUIDataTableFilter: {
                styleOverrides: {
                    root: {
                        padding: '16px',
                        width: '350px',
                    },
                    title: {
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        marginBottom: '16px',
                        color: '#333'
                    },
                    reset: {
                        display: 'none' // We use our own footer
                    }
                }
            },
            MUIDataTableFilterList: {
                styleOverrides: {
                    root: {
                        marginBottom: '16px'
                    }
                }
            }
        }
    });

    return (
        <>
            <PageTitle
                title="Абитуриенты"
                button={hasRole(currentUser, 'manager') ? "Добавить абитуриента" : null}
                onClick={() => {
                    const link = programId
                        ? `#/app/applicants/new?program_id=${programId}`
                        : "#/app/applicants/new";
                    window.location.hash = link;
                }}
            />
            <Grid container spacing={4}>
                <Grid item xs={12}>
                    <StatusLegend />
                <ThemeProvider theme={getMuiTheme()}>
                    <MUIDataTable
                        title="Список абитуриентов"
                        data={applicants}
                        columns={columns}
                        components={{
                            TableFilterList: CustomFilterList,
                        }}
                        options={{
                            filter: true,
                            confirmFilters: true,
                            customFilterDialogFooter: ApplicantTableFilter,
                            filterType: "checkbox",
                            onRowClick: (rowData) => {
                                const url = programId
                                    ? `#/app/applicants/${rowData[0]}?program_id=${programId}`
                                    : `#/app/applicants/${rowData[0]}`;
                                window.location.hash = url;
                            },
                            selectableRows: 'multiple',
                            onRowsDelete: (rowsDeleted) => {
                                const idsToDelete = rowsDeleted.data.map(d => applicants[d.dataIndex].id);
                                if (window.confirm(`Вы уверены, что хотите удалить ${idsToDelete.length} абитуриентов?`)) {
                                    Promise.all(idsToDelete.map(idStr => axios.delete(`${config.manageApi}/v1/applicants/${idStr}`)))
                                        .then(() => {
                                            fetchApplicants();
                                        })
                                        .catch(err => {
                                            console.error("Ошибка при удалении:", err);
                                            alert("Ошибка при удалении абитуриентов");
                                            fetchApplicants();
                                        });
                                } else {
                                    return false;
                                }
                            }
                        }}
                    />
                </ThemeProvider>
                </Grid>
            </Grid>
        </>
    );
}
