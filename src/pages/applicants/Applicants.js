import { Grid } from "@mui/material";
import axios from "axios";
import MUIDataTable from "mui-datatables";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import config from "../../config";

// components
import PageTitle from "../../components/PageTitle/PageTitle";

export default function ApplicantsPage() {
    const [applicants, setApplicants] = useState([]);
    const { programId } = useParams();

    const fetchApplicants = () => {
        const url = programId
            ? `${config.manageApi}/v1/applicants?program_id=${programId}`
            : `${config.manageApi}/v1/applicants`;

        axios.get(url)
            .then(res => {
                setApplicants(res.data || []);
            })
            .catch(err => console.error(err));
    };

    useEffect(() => {
        fetchApplicants();
    }, [programId]);

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
        },
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
            name: "created_at",
            label: "Дата создания",
            options: {
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

    return (
        <>
            <PageTitle
                title="Абитуриенты"
                button="Добавить абитуриента"
                onClick={() => {
                    const link = programId
                        ? `#/app/applicants/new?program_id=${programId}`
                        : "#/app/applicants/new";
                    window.location.hash = link;
                }}
            />
            <Grid container spacing={4}>
                <Grid item xs={12}>
                    <MUIDataTable
                        title="Applicant List"
                        data={applicants}
                        columns={columns}
                        options={{
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
                </Grid>
            </Grid>
        </>
    );
}
