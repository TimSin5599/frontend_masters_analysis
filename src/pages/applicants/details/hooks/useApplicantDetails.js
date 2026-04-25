import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { getToken } from "../../../../utils/tokenManager";
import config from '../../../../config';
import { formatDateForStorage } from '../../../../utils/dateUtils';
import { useUserState } from '../../../../context/UserContext';

export const useApplicantDetails = (id, activeCategory, programId) => {
    const { currentUser } = useUserState();
    const [applicantName, setApplicantName] = useState(`Абитуриент #${id}`);
    const [activeDocumentId, setActiveDocumentId] = useState(null);
    const [processingState, setProcessingState] = useState({});
    const [evaluations, setEvaluations] = useState([]);
    const [expertSlots, setExpertSlots] = useState([]);
    const [allExperts, setAllExperts] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [data, setData] = useState(null);
    const [criteria, setCriteria] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [activeSubTab, setActiveSubTab] = useState(0);
    const [personalDataDocType, setPersonalDataDocType] = useState("passport");
    const [uploadTypeDialogOpen, setUploadTypeDialogOpen] = useState(false);
    const [pendingFile, setPendingFile] = useState(null);
    const [applicantStatus, setApplicantStatus] = useState(null);
    const [notification, setNotification] = useState(null); // { message, severity }
    const [scoringScheme, setScoringSchemeState] = useState('default');

    const fetchApplicantStatus = useCallback(() => {
        axios.get(`${config.manageApi}/v1/applicants/${id}/data?category=passport`)
            .then(res => {
                if (res.data && res.data.status) {
                    setApplicantStatus(res.data.status);
                } else {
                    // fallback if not in passport
                    axios.get(`${config.manageApi}/v1/applicants`)
                        .then(allRes => {
                            const app = (allRes.data || []).find(a => a.id === parseInt(id));
                            if (app) setApplicantStatus(app.status);
                        });
                }
            })
            .catch(console.error);
    }, [id]);

    const updateProcessingState = useCallback((category, status, progressVal) => {
        setProcessingState(prev => {
            const current = prev[category] || {};
            const newProgress = typeof progressVal === 'function' ? progressVal(current.progress || 0) : (progressVal !== undefined ? progressVal : current.progress);
            return {
                ...prev,
                [category]: {
                    status: status !== undefined ? status : current.status,
                    progress: newProgress
                }
            };
        });
    }, []);

    const fetchDocuments = useCallback(() => {
        axios.get(`${config.manageApi}/v1/applicants/${id}/documents`)
            .then(res => setDocuments(res.data))
            .catch(console.error);
    }, [id]);

    const fetchData = useCallback(() => {
        setLoading(true);
        setActiveDocumentId(null);
        setIsEditing(false);
        setActiveSubTab(0);
        
        if (activeCategory === "diploma" || activeCategory === "transcript") {
            Promise.all([
                axios.get(`${config.manageApi}/v1/applicants/${id}/data?category=diploma`),
                axios.get(`${config.manageApi}/v1/applicants/${id}/data?category=transcript`)
            ]).then(([diplomaRes, transcriptRes]) => {
                // Диплом разворачивается последним — его source имеет приоритет для isAI баннера
                setData({
                    ...(transcriptRes.data || {}),
                    ...(diplomaRes.data || {})
                });
                setLoading(false);
            }).catch(err => {
                console.error(err);
                setLoading(false);
            });
        } else {
            const apiCategory = activeCategory === 'personal_data' ? 'personal_data' : activeCategory;
            axios.get(`${config.manageApi}/v1/applicants/${id}/data?category=${apiCategory}`)
                .then(res => {
                    const multiRecordCategories = ['prof_development', 'second_diploma', 'certification', 'achievement', 'recommendation'];
                    if (multiRecordCategories.includes(activeCategory)) {
                        setData(res.data || []);
                    } else {
                        setData(res.data);
                    }
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    const multiRecordCategories = ['prof_development', 'second_diploma', 'certification', 'achievement', 'recommendation'];
                    // Use empty object (not null) so form sections can render editable empty fields
                    setData(multiRecordCategories.includes(activeCategory) ? [] : {});
                    setLoading(false);
                });
        }
    }, [id, activeCategory]);

    const fetchCriteria = useCallback(() => {
        axios.get(`${config.manageApi}/v1/applicants/${id}/criteria`)
            .then(res => setCriteria(res.data))
            .catch(err => {
                console.error("Error fetching criteria:", err);
                // Fallback if needed, but the backend should provide them
            });
    }, [id]);

    const fetchEvaluations = useCallback((directData) => {
        if (directData && Array.isArray(directData)) {
            setEvaluations(directData);
            return;
        }
        
        if (!currentUser) return;

        const userId = currentUser?.id || currentUser?._id || "";
        const role = String(currentUser?.role || "").toLowerCase();
        
        axios.get(`${config.manageApi}/v1/applicants/${id}/evaluations?user_id=${userId}&user_role=${role}`)
            .then(res => {
                setEvaluations(res.data);
            })
            .catch(err => {
                console.error("Error fetching evaluations:", err);
            });
    }, [id, currentUser]);

    const fetchExpertSlots = useCallback(() => {
        if (!programId) return;
        axios.get(`${config.manageApi}/v1/experts/slots?program_id=${programId}`)
            .then(res => setExpertSlots(res.data))
            .catch(console.error);
    }, [programId]);

    const fetchAllExperts = useCallback(() => {
        axios.get(`${config.manageApi}/v1/experts`)
            .then(res => setAllExperts(res.data))
            .catch(console.error);
    }, []);

    const fetchScoringScheme = useCallback(() => {
        axios.get(`${config.manageApi}/v1/applicants/${id}/scoring-scheme`)
            .then(res => setScoringSchemeState(res.data.scheme || 'default'))
            .catch(console.error);
    }, [id]);

    const updateScoringScheme = useCallback((newScheme) => {
        const role = String(currentUser?.role || "").toLowerCase();
        return axios.patch(`${config.manageApi}/v1/applicants/${id}/scoring-scheme`, {
            scheme: newScheme,
            user_role: role,
        }).then(() => {
            setScoringSchemeState(newScheme === 'auto' ? 'default' : newScheme);
            fetchScoringScheme();
            fetchCriteria();
        });
    }, [id, currentUser, fetchScoringScheme, fetchCriteria]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (!id) return;
        
        // 1. Fetch non-user-dependent data
        fetchCriteria();
        fetchScoringScheme();
        fetchExpertSlots();
        fetchAllExperts();
        fetchDocuments();
        fetchApplicantStatus();

        // 2. Fetch applicant name
        axios.get(`${config.manageApi}/v1/applicants/${id}/data?category=passport`)
            .then(res => {
                if (res.data && res.data.name && res.data.surname) {
                    setApplicantName(`${res.data.name} ${res.data.surname}`);
                }
            })
            .catch(err => console.error("Error fetching applicant name:", err));
    }, [id, fetchCriteria, fetchScoringScheme, fetchExpertSlots, fetchAllExperts, fetchDocuments, fetchApplicantStatus]);

    // 3. Separate effect for evaluations to ensure they refresh when currentUser loads
    useEffect(() => {
        if (id && currentUser) {
            fetchEvaluations();
        }
    }, [id, currentUser, fetchEvaluations]);

    // Auto-select document when category or documents change
    useEffect(() => {
        if (!documents || documents.length === 0) return;

        if (activeCategory === 'personal_data') {
            const doc = documents.find(d => {
                if (personalDataDocType === 'passport') {
                    return d.file_type === 'passport';
                }
                return d.file_type === 'resume';
            });
            if (doc) setActiveDocumentId(doc.id);
            else setActiveDocumentId(null);
        } else if (activeCategory === 'diploma') {
            const doc = documents.find(d => d.file_type === 'diploma');
            if (doc) setActiveDocumentId(doc.id);
        } else if (activeCategory === 'transcript') {
            const doc = documents.find(d => d.file_type === 'transcript');
            if (doc) setActiveDocumentId(doc.id);
        } else if (['prof_development', 'second_diploma', 'certification', 'achievement', 'recommendation'].includes(activeCategory)) {
            if (Array.isArray(data) && data[activeSubTab]) {
                setActiveDocumentId(data[activeSubTab].document_id || null);
            }
        } else if (data && !Array.isArray(data) && data.document_id) {
            setActiveDocumentId(data.document_id);
        }
    }, [documents, activeCategory, personalDataDocType, activeSubTab, data]);

    // WebSocket logic
    useEffect(() => {
        let socket;
        let reconnectTimeout;

        const connectWebSocket = () => {
            const token = getToken();
            if (!token || token === "null" || token === "undefined") {
                reconnectTimeout = setTimeout(connectWebSocket, 1000);
                return;
            }
            const wsBase = config.manageApi.startsWith('http')
                ? config.manageApi.replace(/^http/, 'ws')
                : `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}${config.manageApi}`;
            const wsUrl = wsBase + `/v1/applicants/${id}/ws?token=${token}`;
            socket = new WebSocket(wsUrl);

            socket.onmessage = (event) => {
                const msgData = JSON.parse(event.data);

                // Авто-переход: все документы обработаны, статус изменился
                if (msgData.event === 'status_changed' && msgData.status === 'verifying') {
                    setApplicantStatus('verifying');
                    setNotification({ message: 'Все документы проанализированы. Абитуриент передан на проверку.', severity: 'success' });
                    return;
                }

                // Авто-переход: все документы обработаны, но не хватает обязательных
                if (msgData.event === 'analysis_done') {
                    setNotification({ message: `Анализ завершён. Не хватает документов: ${msgData.missing}`, severity: 'warning' });
                    return;
                }

                if (msgData.category) {
                    const baseCategory = msgData.category.split(':')[0]; // strip docType suffix
                    if (msgData.status === 'completed') {
                        updateProcessingState(baseCategory, 'completed', 100);
                        fetchDocuments();
                        if (baseCategory === activeCategory || msgData.category === activeCategory) fetchData();
                    } else if (msgData.status === 'classification_failed' || msgData.status === 'extraction_failed') {
                        // Terminal error — refresh docs so the UI shows the persisted error status
                        updateProcessingState(baseCategory, msgData.status, 0);
                        fetchDocuments();
                        if (baseCategory === activeCategory || msgData.category === activeCategory) fetchData();
                    } else if (msgData.status === 'failed') {
                        // Legacy fallback
                        updateProcessingState(baseCategory, 'extraction_failed', 0);
                        fetchDocuments();
                    } else {
                        // In-flight statuses: classifying, classified, extracting, processing, saving
                        updateProcessingState(baseCategory, 'processing', msgData.progress || 0);
                    }
                }
            };

            socket.onclose = () => {
                reconnectTimeout = setTimeout(connectWebSocket, 3000);
            };
        };

        connectWebSocket();
        return () => {
            clearTimeout(reconnectTimeout);
            if (socket) socket.close();
        };
    }, [id, activeCategory, updateProcessingState, fetchDocuments, fetchData]);

    // Progressive loading simulation
    const processingStatus = processingState[activeCategory]?.status || null;
    const progress = processingState[activeCategory]?.progress || 0;

    useEffect(() => {
        let interval;
        if (processingStatus === 'processing') {
            interval = setInterval(() => {
                updateProcessingState(activeCategory, undefined, prev => {
                    if (prev < 15) return prev + 5;
                    if (prev < 30) return prev + 2;
                    if (prev < 90) return prev + 0.5;
                    return prev;
                });
            }, 1000);
        } else if (processingStatus === 'completed') {
            updateProcessingState(activeCategory, undefined, 100);
            const timer = setTimeout(() => updateProcessingState(activeCategory, null, 0), 3000);
            return () => clearTimeout(timer);
        }
        return () => clearInterval(interval);
    }, [processingStatus, activeCategory, updateProcessingState]);

    const handleSave = () => {
        let userMeta = {};
        if (currentUser) {
            let roleLabel = 'оператор';
            if (currentUser.role === 'admin')   roleLabel = 'админ';
            if (currentUser.role === 'manager') roleLabel = 'менеджер';
            if (currentUser.role === 'expert')  roleLabel = 'эксперт';
            userMeta = {
                role:       roleLabel,
                first_name: currentUser.firstName  || "",
                last_name:  currentUser.lastName   || "",
                patronymic: currentUser.patronymic || "",
            };
        }

        // Pre-process date fields to ensure they are in YYYY-MM-DD format for storage
        const processDateFields = (obj) => {
            if (!obj) return obj;
            const newObj = { ...obj };
            const dateFields = ['date_of_birth', 'graduation_date', 'start_date', 'end_date', 'date_received'];
            dateFields.forEach(field => {
                if (newObj[field]) {
                    newObj[field] = formatDateForStorage(newObj[field]);
                }
            });
            return newObj;
        };

        let processedData;
        if (Array.isArray(data)) {
            processedData = data.map(record => processDateFields(record));
        } else {
            processedData = processDateFields(data);
        }

        const payload = Array.isArray(processedData) ? { records: processedData, ...userMeta } : { ...processedData, ...userMeta };
        const apiCategory = activeCategory === 'personal_data' ? personalDataDocType : activeCategory;

        // Для диплома патчим и диплом, и транскрипт одним вызовом — оба хранятся совместно
        const requests = (activeCategory === 'diploma' || activeCategory === 'transcript')
            ? [
                axios.patch(`${config.manageApi}/v1/applicants/${id}/data?category=diploma`, payload),
                axios.patch(`${config.manageApi}/v1/applicants/${id}/data?category=transcript`, payload),
              ]
            : [axios.patch(`${config.manageApi}/v1/applicants/${id}/data?category=${apiCategory}`, payload)];

        Promise.all(requests)
            .then(() => {
                alert("Данные успешно сохранены");
                setIsEditing(false);
                fetchData();
            })
            .catch(err => {
                console.error(err);
                alert("Ошибка при сохранении данных");
            });
    };

    const handleDelete = (itemId) => {
        if (window.confirm("Вы уверены, что хотите удалить эту запись?")) {
            axios.delete(`${config.manageApi}/v1/applicants/${id}/data/${activeCategory}/${itemId}`)
                .then(() => {
                    setActiveSubTab(0);
                    fetchData();
                })
                .catch(err => { console.error(err); alert("Ошибка при удалении"); });
        }
    };

    const handleDeleteDocument = (docId) => {
        if (window.confirm("Вы уверены, что хотите полностью удалить этот документ и все связанные с ним извлеченные данные?")) {
            return axios.delete(`${config.manageApi}/v1/applicants/${id}/documents/${docId}`)
                .then(() => {
                    alert("Документ удален");
                    setActiveDocumentId(null);
                    fetchDocuments();
                    fetchData();
                })
                .catch(err => { console.error(err); alert("Ошибка при удалении документа"); throw err; });
        }
        return Promise.reject("Deletion cancelled");
    };

    const uploadDocumentWithData = (file, docType = "") => {
        const formData = new FormData();
        formData.append('file', file);
        const apiCategory = activeCategory === 'personal_data' ? docType : activeCategory;
        formData.append('category', apiCategory);
        // If we are uploading within personal_data, we already set the category to passport/resume.
        // We don't necessarily need doc_type here if category is specific, but let's keep logic for consistency if docType is provided.
        if (docType && activeCategory !== 'personal_data') formData.append('doc_type', docType);

        updateProcessingState(activeCategory, 'processing', 0);
        axios.post(`${config.manageApi}/v1/applicants/${id}/documents`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
        .then(res => {
            alert("Документ загружен и поставлен в очередь.");
            if (res.data && res.data.document_id) {
                setActiveDocumentId(res.data.document_id);
                fetchDocuments();
            }
        })
        .catch(err => { console.error(err); alert("Ошибка при загрузке документа"); updateProcessingState(activeCategory, null); });
    };

    const confirmRescan = (docId) => {
        let targetId = docId || activeDocumentId;
        if (!targetId && data && !Array.isArray(data) && data.document_id) {
            targetId = data.document_id;
        }

        updateProcessingState(activeCategory, 'processing', 0);

        if (targetId) {
            axios.post(`${config.manageApi}/v1/documents/${targetId}/reprocess`)
                .catch(err => { console.error(err); updateProcessingState(activeCategory, null); });
        } else {
            axios.post(`${config.manageApi}/v1/applicants/${id}/documents/reprocess?category=${activeCategory}`)
                .catch(err => { console.error(err); updateProcessingState(activeCategory, null); });
        }
    };

    const transferToExperts = () => {
        setLoading(true);
        const userName = [currentUser?.first_name, currentUser?.last_name].filter(Boolean).join(' ') || currentUser?.email || '';
        const userRole = currentUser?.role || '';
        axios.post(`${config.manageApi}/v1/applicants/${id}/transfer-to-experts`, { user_name: userName, user_role: userRole })
            .then(() => {
                alert("Абитуриент успешно передан экспертам");
                fetchApplicantStatus();
            })
            .catch(err => {
                console.error(err);
                alert("Ошибка при передаче экспертам");
            })
            .finally(() => setLoading(false));
    };

    const handleSaveCategory = (docId, newCategory) => {
        axios.patch(`${config.manageApi}/v1/documents/${docId}/category`, { category: newCategory })
            .then(() => {
                alert("Категория документа изменена, начата обработка.");
                fetchDocuments();
                fetchData();
            })
            .catch(err => {
                console.error(err);
                alert("Ошибка при изменении категории");
            });
    };

    return {
        applicantName,
        applicantStatus,
        data, setData,
        loading,
        isEditing, setIsEditing,
        activeSubTab, setActiveSubTab,
        activeDocumentId, setActiveDocumentId,
        documents,
        personalDataDocType, setPersonalDataDocType,
        processingStatus, progress,
        uploadTypeDialogOpen, setUploadTypeDialogOpen,
        pendingFile, setPendingFile,
        evaluations, fetchEvaluations,
        expertSlots,
        currentUser,
        handleSave,
        handleDelete,
        handleDeleteDocument,
        uploadDocumentWithData,
        confirmRescan,
        fetchData,
        fetchDocuments,
        criteria,
        fetchCriteria,
        allExperts,
        fetchExpertSlots,
        transferToExperts,
        handleSaveCategory,
        notification, setNotification,
        scoringScheme,
        updateScoringScheme,
    };
};
