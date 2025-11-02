'use strict';

/* global appwriteClient, APPWRITE_CONFIG, appShell, dashboardI18n */

const appwriteSdk = window.Appwrite;
const i18n = window.dashboardI18n;

function translate(key, fallback, params) {
    if (i18n && typeof i18n.t === 'function') {
        const value = i18n.t(key, params);
        if (value !== undefined && value !== null && value !== key) {
            return value;
        }
    }
    if (!fallback) return key;
    if (!params) return fallback;
    return fallback.replace(/\{(\w+)\}/g, (match, token) => {
        if (Object.prototype.hasOwnProperty.call(params, token)) {
            return params[token];
        }
        return match;
    });
}

function formatCurrency(value) {
    const amount = Number(value || 0).toFixed(2);
    return translate('productPrice', `${amount} ر.س`, { amount });
}

const productsModule = (() => {
    const selectors = {
        listContainer: document.getElementById('productsList'),
        emptyState: document.getElementById('productsEmptyState'),
        searchInput: document.getElementById('productsSearch'),
        addButton: document.getElementById('addProductBtn'),
        editor: document.getElementById('productEditor'),
        editorTitle: document.getElementById('productEditorTitle'),
        editorForm: document.getElementById('productEditorForm'),
        editorClose: document.querySelector('[data-close-editor]'),
        imageInput: document.getElementById('productImage'),
        imagePreview: document.getElementById('productImagePreview'),
        chipFilter: document.getElementById('categoryFilter')
    };

    const fields = [
        'name_ar',
        'name_en',
        'sku',
        'price',
        'discount',
        'current_stock',
        'initial_stock',
        'category',
        'badge',
        'description_ar',
        'description_en'
    ];

    const state = {
        items: [],
        search: '',
        category: 'all',
        editing: null,
        uploadingFileId: null,
        uploadingUrl: null,
        lang: (i18n && typeof i18n.getLanguage === 'function')
            ? i18n.getLanguage()
            : (document.documentElement.lang || 'ar')
    };

    function getLocalizedName(product) {
        if (!product) return '';
        if (state.lang === 'en') {
            return product.name_en || product.name_ar || '';
        }
        return product.name_ar || product.name_en || '';
    }

    function parseNumber(value) {
        if (value === null || value === undefined) return 0;
        const normalized = value.toString().replace(/[^0-9.-]/g, '');
        if (!normalized) return 0;
        const parsed = Number(normalized);
        return Number.isNaN(parsed) ? 0 : parsed;
    }

    async function init() {
        if (!selectors.listContainer) return;
        selectors.searchInput?.addEventListener('input', handleSearch);
        selectors.addButton?.addEventListener('click', () => openEditor());
        document
            .querySelectorAll('[data-close-editor]')
            .forEach((closeBtn) => closeBtn.addEventListener('click', closeEditor));
        selectors.editor?.addEventListener('click', (event) => {
            if (event.target === selectors.editor) closeEditor();
        });
        selectors.editorForm?.addEventListener('submit', handleSubmit);
        selectors.imageInput?.addEventListener('change', handleImageSelect);
        selectors.chipFilter?.addEventListener('click', handleCategoryClick);

        if (i18n && typeof i18n.onChange === 'function') {
            i18n.onChange((lang) => setLanguage(lang));
        }

        setLanguage(state.lang, { skipRender: true });
        await loadProducts();
    }

    async function loadProducts() {
        try {
            appShell.setLoading(true);
            const response = await appwriteClient.databases.listDocuments(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.productsCollectionId,
                [appwriteSdk.Query.limit(200), appwriteSdk.Query.orderDesc('$createdAt')]
            );
            state.items = response.documents;
            renderProducts();
        } catch (error) {
            console.error('Failed to load products', error);
            appShell.showToast(translate('toastLoadProductsError', 'تعذر تحميل المنتجات'));
        } finally {
            appShell.setLoading(false);
        }
    }

    function handleSearch(event) {
        state.search = event.target.value.trim().toLowerCase();
        renderProducts();
    }

    function handleCategoryClick(event) {
        const button = event.target.closest('button[data-category]');
        if (!button) return;
        state.category = button.dataset.category;
        document
            .querySelectorAll('#categoryFilter button')
            .forEach((chip) => chip.classList.toggle('is-active', chip === button));
        renderProducts();
    }

    function getFilteredItems() {
        return state.items.filter((item) => {
            const matchesCategory =
                state.category === 'all' || (item.category || '').toLowerCase() === state.category;
            if (!matchesCategory) return false;
            if (!state.search) return true;
            const fieldsToSearch = [item.name_ar, item.name_en, item.sku, item.category];
            return fieldsToSearch.some((value) =>
                (value || '').toString().toLowerCase().includes(state.search)
            );
        });
    }

    function renderProducts() {
        if (!selectors.listContainer) return;
        const items = getFilteredItems();
        selectors.listContainer.innerHTML = '';
        if (!items.length) {
            selectors.emptyState?.classList.add('is-visible');
            updateStats();
            return;
        }
        selectors.emptyState?.classList.remove('is-visible');
        const fragment = document.createDocumentFragment();
        items.forEach((item) => {
            fragment.appendChild(renderProductCard(item));
        });
        selectors.listContainer.appendChild(fragment);
        updateStats();
    }

    function renderProductCard(product) {
        const card = document.createElement('article');
        card.className = 'product-card';

        const media = document.createElement('div');
        media.className = 'product-card__media';
        const img = document.createElement('img');
        img.src = product.image || 'https://via.placeholder.com/400x400?text=Product';
    const productName = getLocalizedName(product) || translate('productCardNoName', 'منتج بدون اسم');
    img.alt = productName || 'Product image';
        media.appendChild(img);
        card.appendChild(media);

        const body = document.createElement('div');
        body.className = 'product-card__body';

        const title = document.createElement('h3');
        title.className = 'product-card__title';
    title.textContent = productName;

        const priceRow = document.createElement('div');
        priceRow.className = 'product-card__meta';

        const price = document.createElement('span');
        price.className = 'product-card__price';
    price.textContent = formatCurrency(product.price);

        const stock = document.createElement('span');
        stock.className = 'product-card__stock';
    stock.textContent = `${translate('productCardStock', 'المخزون')}: ${product.current_stock ?? 0}`;

        priceRow.append(price, stock);

        const actions = document.createElement('div');
        actions.className = 'product-card__actions';

        const editBtn = document.createElement('button');
        editBtn.className = 'secondary-button';
    editBtn.textContent = translate('productCardEdit', 'تعديل');
        editBtn.addEventListener('click', () => openEditor(product));

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'danger-button';
    deleteBtn.textContent = translate('productCardDelete', 'حذف');
        deleteBtn.addEventListener('click', () => confirmDelete(product));

        actions.append(editBtn, deleteBtn);
        body.append(title, priceRow, actions);
        card.appendChild(body);
        return card;
    }

    function openEditor(product) {
        if (!selectors.editor || !selectors.editorForm) return;
        state.editing = product || null;
        selectors.editorForm.reset();
        state.uploadingFileId = null;
        state.uploadingUrl = product?.image || null;
        updatePreview(state.uploadingUrl);
        if (product) {
            fields.forEach((field) => {
                const input = selectors.editorForm.elements[field];
                if (!input) return;
                const value = product[field];
                if (['price', 'discount', 'current_stock', 'initial_stock'].includes(field)) {
                    input.value = parseNumber(value);
                } else {
                    input.value = value !== undefined && value !== null ? value : '';
                }
            });
        }
        selectors.editor.classList.add('is-visible');
        refreshEditorLanguage();
    }

    function refreshEditorLanguage() {
        if (!selectors.editorTitle) return;
        const titleKey = state.editing ? 'editorEditTitle' : 'editorAddTitle';
        const fallbackTitle = state.editing ? 'تعديل المنتج' : 'إضافة منتج جديد';
        selectors.editorTitle.textContent = translate(titleKey, fallbackTitle);
        const badgeInput = selectors.editorForm?.elements?.badge;
        if (badgeInput) {
            badgeInput.placeholder = translate('editorBadgePlaceholder', 'مثال: new');
        }
    }

    function closeEditor() {
        selectors.editor?.classList.remove('is-visible');
        selectors.editorForm?.reset();
        state.editing = null;
        state.uploadingFileId = null;
        state.uploadingUrl = null;
        updatePreview(null);
        refreshEditorLanguage();
    }

    function updatePreview(src) {
        if (!selectors.imagePreview) return;
        if (!src) {
            selectors.imagePreview.innerHTML = '';
            const placeholder = document.createElement('span');
            placeholder.textContent = translate('editorNoImage', 'لم يتم اختيار صورة');
            selectors.imagePreview.appendChild(placeholder);
            return;
        }
        const img = document.createElement('img');
        img.src = src;
        selectors.imagePreview.innerHTML = '';
        selectors.imagePreview.appendChild(img);
    }

    async function handleImageSelect(event) {
        const file = event.target.files?.[0];
        if (!file) {
            state.uploadingFileId = null;
            state.uploadingUrl = null;
            updatePreview(null);
            return;
        }
        try {
            appShell.setLoading(true);
            const fileId = appwriteSdk.ID.unique();
            const uploaded = await appwriteClient.storage.createFile(
                APPWRITE_CONFIG.storageBucketId,
                fileId,
                file
            );
            state.uploadingFileId = uploaded.$id;
            state.uploadingUrl = `${APPWRITE_CONFIG.endpoint}/storage/buckets/${APPWRITE_CONFIG.storageBucketId}/files/${uploaded.$id}/view?project=${APPWRITE_CONFIG.projectId}&mode=admin`;
            updatePreview(state.uploadingUrl);
            appShell.showToast(translate('toastImageUploadSuccess', 'تم رفع الصورة بنجاح'));
        } catch (error) {
            console.error('Image upload failed', error);
            const details = typeof error?.message === 'string' ? error.message : '';
            const baseMessage = translate('toastImageUploadError', 'تعذر رفع الصورة');
            appShell.showToast(details ? `${baseMessage}: ${details}` : baseMessage);
            state.uploadingFileId = null;
            state.uploadingUrl = null;
            updatePreview(null);
        } finally {
            appShell.setLoading(false);
        }
    }

    async function handleSubmit(event) {
        event.preventDefault();
        if (!selectors.editorForm) return;
        const payload = {};
        fields.forEach((field) => {
            const input = selectors.editorForm.elements[field];
            if (!input) return;
            const value = input.value.trim();
            if (['price', 'discount', 'current_stock', 'initial_stock'].includes(field)) {
                payload[field] = parseNumber(value);
            } else {
                payload[field] = value || '';
            }
        });
        if (state.uploadingUrl) {
            payload.image = state.uploadingUrl;
            payload.imageId = state.uploadingFileId;
        } else if (!state.editing) {
            payload.image = '';
        }
        try {
            appShell.setLoading(true);
            if (state.editing) {
                await appwriteClient.databases.updateDocument(
                    APPWRITE_CONFIG.databaseId,
                    APPWRITE_CONFIG.productsCollectionId,
                    state.editing.$id,
                    payload
                );
                appShell.showToast(translate('toastUpdateSuccess', 'تم تحديث المنتج'));
            } else {
                await appwriteClient.databases.createDocument(
                    APPWRITE_CONFIG.databaseId,
                    APPWRITE_CONFIG.productsCollectionId,
                    appwriteSdk.ID.unique(),
                    payload
                );
                appShell.showToast(translate('toastCreateSuccess', 'تم إضافة المنتج'));
            }
            await loadProducts();
            closeEditor();
        } catch (error) {
            console.error('Failed to save product', error);
            const details = typeof error?.message === 'string' ? error.message : '';
            const baseMessage = translate('toastSaveError', 'تعذر حفظ المنتج');
            appShell.showToast(details ? `${baseMessage}: ${details}` : baseMessage);
        } finally {
            appShell.setLoading(false);
        }
    }

    function confirmDelete(product) {
        const productName = getLocalizedName(product) || product.name_ar || product.name_en || '';
        const message = translate('confirmDelete', 'هل تريد حذف المنتج "{name}"؟', { name: productName });
        const confirmed = window.confirm(message);
        if (!confirmed) return;
        deleteProduct(product.$id);
    }

    async function deleteProduct(documentId) {
        try {
            appShell.setLoading(true);
            await appwriteClient.databases.deleteDocument(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.productsCollectionId,
                documentId
            );
            appShell.showToast(translate('toastDeleteSuccess', 'تم حذف المنتج'));
            await loadProducts();
        } catch (error) {
            console.error('Failed to delete product', error);
            appShell.showToast(translate('toastDeleteError', 'تعذر حذف المنتج'));
        } finally {
            appShell.setLoading(false);
        }
    }

    function onShow() {
        // Refresh when returning to view to pick up external changes
        loadProducts();
    }

    function updateStats() {
        const activeCount = document.getElementById('statActiveProducts');
        const lowStockCount = document.getElementById('statLowStock');
        if (activeCount) activeCount.textContent = state.items.length;
        if (lowStockCount) {
            const lowStock = state.items.filter((item) => Number(item.current_stock || 0) <= 5).length;
            lowStockCount.textContent = lowStock;
        }
    }

    function setLanguage(lang, options = {}) {
        const normalized = lang === 'en' ? 'en' : 'ar';
        const hasChanged = state.lang !== normalized;
        state.lang = normalized;
        refreshEditorLanguage();
        updatePreview(state.uploadingUrl);
        if (!options.skipRender && hasChanged) {
            renderProducts();
        }
        if (options.force) {
            renderProducts();
        }
        updateStats();
    }

    return {
        init,
        onShow,
        setLanguage
    };
})();

window.productsModule = productsModule;
