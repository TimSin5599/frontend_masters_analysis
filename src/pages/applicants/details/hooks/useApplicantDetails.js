import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import config from '../../../../config';
import { formatDateForStorage } from '../../../../utils/dateUtils';

export const useApplicantDetails = (id, activeCategory) => {
    const [applicantName, setApplicantName] = useState(`Абитуриент #${id}`);
    const [activeDocumentId, setActiveDocumentId] = useState(null);
    const [processingState, setProcessingState] = useState({});
    const [evaluations, setEvaluations] = useState([]);
    const [expertSlots, setExpertSlots] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [activeSubTab, setActiveSubTab] = useState(0);
    const [personalDataDocType, setPersonalDataDocType] = useState("passport");
    const [uploadTypeDialogOpen, setUploadTypeDialogOpen] = useState(false);
    const [pendingFile, setPendingFile] = useState(null);

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
        
        if (activeCategory === "diploma") {
            Promise.all([
                axios.get(`${config.manageApi}/v1/applicants/${id}/data?category=diploma`),
                axios.get(`${config.manageApi}/v1/applicants/${id}/data?category=transcript`)
            ]).then(([diplomaRes, transcriptRes]) => {
                setData({
                    ...(diplomaRes.data || {}),
                    ...(transcriptRes.data || {})
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
                    setData(multiRecordCategories.includes(activeCategory) ? [] : null);
                    setLoading(false);
                });
        }
    }, [id, activeCategory]);

    const fetchEvaluations = useCallback(() => {
        axios.get(`${config.manageApi}/v1/applicants/${id}/evaluations`)
            .then(res => setEvaluations(res.data))
            .catch(console.error);
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        // Fetch initial name
        axios.get(`${config.manageApi}/v1/applicants/${id}/data?category=passport`)
            .then(res => {
                if (res.data && res.data.name && res.data.surname) {
                    setApplicantName(`${res.data.name} ${res.data.surname}`);
                }
            })
            .catch(console.error);
        
        fetchEvaluations();
        
        axios.get(`${config.manageApi}/v1/experts/slots`)
            .then(res => setExpertSlots(res.data))
            .catch(console.error);

        try {
            const userStr = localStorage.getItem("user");
            if (userStr) {
                setCurrentUser(JSON.parse(userStr));
            }
        } catch (e) {
            console.error(e);
        }

        fetchDocuments();
    }, [id, fetchEvaluations, fetchDocuments]);

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
            const wsUrl = config.manageApi.replace('http', 'ws') + `/v1/applicants/${id}/ws`;
            socket = new WebSocket(wsUrl);

            socket.onmessage = (event) => {
                const msgData = JSON.parse(event.data);
                if (msgData.category) {
                    if (msgData.status === 'completed') {
                        updateProcessingState(msgData.category, 'completed', 100);
                        fetchDocuments();
                        if (msgData.category === activeCategory) fetchData();
                    } else if (msgData.status === 'failed') {
                        updateProcessingState(msgData.category, 'failed');
                        setTimeout(() => updateProcessingState(msgData.category, null), 3000);
                    } else {
                        updateProcessingState(msgData.category, 'processing', msgData.progress || 0);
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
        try {
            const userStr = localStorage.getItem("user");
            if (userStr) {
                const userObj = JSON.parse(userStr);
                userMeta = {
                    role: userObj.role === 'admin' ? 'админ' : 'оператор',
                    first_name: userObj.firstName || "",
                    last_name: userObj.lastName || "",
                    patronymic: userObj.patronymic || ""
                };
            }
        } catch (e) { console.error(e); }

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
        axios.patch(`${config.manageApi}/v1/applicants/${id}/data?category=${apiCategory}`, payload)
            .then(() => {
                alert("Данные успешно сохранены");
                setIsEditing(false);
                fetchData(); // Refresh to get standardized format from backend if needed
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

    return {
        applicantName,
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
        fetchDocuments
    };
};
