import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAMkke6dtnF-GbbXpPo_NCcQIZptNIS_Xs",
    authDomain: "ukssekolah-dd66b.firebaseapp.com",
    projectId: "ukssekolah-dd66b",
    storageBucket: "ukssekolah-dd66b.firebasestorage.app",
    messagingSenderId: "69239100227",
    appId: "1:69239100227:web:df91da778c5a9dc34655f6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window.switchTab = function(tab) {
    const viewSiswa = document.getElementById('viewSiswa');
    const viewAdmin = document.getElementById('viewAdmin');
    const btnSiswa = document.getElementById('btnSiswa');
    const btnAdmin = document.getElementById('btnAdmin');

    if (tab === 'siswa') {
        viewSiswa.classList.remove('hidden');
        viewAdmin.classList.add('hidden');
        btnSiswa.className = "bg-emerald-700 px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer";
        btnAdmin.className = "bg-emerald-800/50 px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer";
        muatDataSiswa();
    } else {
        viewSiswa.classList.add('hidden');
        viewAdmin.classList.remove('hidden');
        btnAdmin.className = "bg-emerald-700 px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer";
        btnSiswa.className = "bg-emerald-800/50 px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer";
        muatDataAdmin();
    }
}

window.cekAksesAdmin = async function() {
    let isAdminLoggedIn = sessionStorage.getItem('adminLoggedIn');
    if (isAdminLoggedIn === 'true') {
        window.switchTab('admin');
        return;
    }

    const { value: password } = await Swal.fire({
        title: 'Login Petugas UKS',
        input: 'password',
        inputPlaceholder: 'Masukkan password admin',
        showCancelButton: true,
        confirmButtonText: 'Masuk',
        cancelButtonText: 'Batal',
        confirmButtonColor: '#059669'
    });

    if (password === 'uks123') {
        sessionStorage.setItem('adminLoggedIn', 'true');
        Swal.fire({ icon: 'success', title: 'Berhasil Masuk!', timer: 1500, showConfirmButton: false });
        window.switchTab('admin');
    } else if (password !== undefined) {
        Swal.fire({ icon: 'error', title: 'Password Salah!', text: 'Anda bukan petugas UKS.' });
    }
}

window.logoutAdmin = function() {
    sessionStorage.removeItem('adminLoggedIn');
    window.switchTab('siswa');
    Swal.fire({ icon: 'info', title: 'Keluar Admin', timer: 1500, showConfirmButton: false });
}

window.kirimPermintaan = async function(e) {
    e.preventDefault();
    
    const newItem = {
        nama: document.getElementById('nama').value,
        kelas: document.getElementById('kelas').value,
        penyakit: document.getElementById('penyakit').value,
        obat: document.getElementById('pilihanObat').value,
        status: 'Menunggu',
        waktu: Date.now()
    };

    try {
        await addDoc(collection(db, "permintaanUKS"), newItem);

        Swal.fire({
            icon: 'success',
            title: 'Berhasil Dikirim!',
            text: 'Permintaan obat Anda telah dikirim ke petugas UKS.',
            timer: 2000,
            showConfirmButton: false
        });

        document.getElementById('formPermintaan').reset();
        
        muatDataSiswa(); 
    } catch (error) {
        console.error("Gagal mengirim data: ", error);
        Swal.fire({ icon: 'error', title: 'Oops...', text: 'Gagal mengirim permintaan!' });
    }
}

async function muatDataSiswa() {
    const container = document.getElementById('statusListSiswa');
    if (!container) return;
    container.innerHTML = `<p class="text-sm text-slate-400 italic">Memuat data...</p>`;

    try {
        const querySnapshot = await getDocs(collection(db, "permintaanUKS"));
        if (querySnapshot.empty) {
            container.innerHTML = `<p class="text-sm text-slate-400 italic">Belum ada riwayat pengajuan.</p>`;
            return;
        }

        let html = '';
        querySnapshot.forEach((docSnap) => {
            const item = docSnap.data();
            let badgeColor = "bg-amber-100 text-amber-700";
            let pesanStatus = "Menunggu konfirmasi petugas UKS...";
            
            if (item.status === 'Disetujui') {
                badgeColor = "bg-emerald-100 text-emerald-700";
                pesanStatus = "Permintaan anda telah disetujui, harap datang ke UKS";
            } else if (item.status === 'Ditolak') {
                badgeColor = "bg-rose-100 text-rose-700";
                pesanStatus = "✕ Mohon maaf, stok obat kosong atau permintaan ditolak.";
            }

            html += `
                <div class="p-4 border rounded-xl space-y-2 bg-slate-50/50">
                    <div class="flex justify-between items-center">
                        <span class="font-semibold text-sm">${item.obat}</span>
                        <span class="px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeColor}">${item.status}</span>
                    </div>
                    <p class="text-xs text-slate-500">Nama: ${item.nama} (${item.kelas})</p>
                    <p class="text-xs text-slate-500">Keluhan: ${item.penyakit}</p>
                    <p class="text-xs font-medium text-slate-600">${pesanStatus}</p>
                </div>
            `;
        });
        container.innerHTML = html;
    } catch (error) {
        console.error("Gagal memuat data:", error);
    }
}

async function muatDataAdmin() {
    const tbody = document.getElementById('tabelAdmin');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="5" class="py-4 text-center text-slate-400 italic">Memuat data dari database...</td></tr>`;

    try {
        const querySnapshot = await getDocs(collection(db, "permintaanUKS"));
        if (querySnapshot.empty) {
            tbody.innerHTML = `<tr><td colspan="5" class="py-4 text-center text-slate-400 italic">Belum ada permintaan masuk.</td></tr>`;
            return;
        }

        let html = '';
        let adaDataMenunggu = false;

        querySnapshot.forEach((docSnap) => {
            const id = docSnap.id;
            const item = docSnap.data();
            
            if (item.status === 'Menunggu') {
                adaDataMenunggu = true;
                html += `
                    <tr class="border-b">
                        <td class="py-3">
                            <p class="font-medium">${item.nama}</p>
                            <p class="text-xs text-slate-400">${item.kelas}</p>
                        </td>
                        <td class="py-3">${item.penyakit}</td>
                        <td class="py-3 font-semibold text-emerald-600">${item.obat}</td>
                        <td class="py-3">
                            <span class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">${item.status}</span>
                        </td>
                        <td class="py-3 text-center space-x-1">
                            <button onclick="ubahStatus('${id}', 'Disetujui')" class="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1 rounded-lg text-xs font-medium cursor-pointer">Setujui</button>
                            <button onclick="ubahStatus('${id}', 'Ditolak')" class="bg-rose-500 hover:bg-rose-600 text-white px-3 py-1 rounded-lg text-xs font-medium cursor-pointer">Tolak</button>
                        </td>
                    </tr>
                `;
            }
        });

        if (!adaDataMenunggu) {
            tbody.innerHTML = `<tr><td colspan="5" class="py-4 text-center text-slate-400 italic">Tidak ada permintaan baru yang menunggu.</td></tr>`;
        } else {
            tbody.innerHTML = html;
        }
    } catch (error) {
        console.error("Gagal memuat admin:", error);
    }
}

window.ubahStatus = async function(id, statusBaru) {
    try {
        const docRef = doc(db, "permintaanUKS", id);
        await updateDoc(docRef, { status: statusBaru });
        
        Swal.fire({
            icon: 'success',
            title: `Berhasil ${statusBaru}`,
            timer: 1000,
            showConfirmButton: false
        });

        muatDataAdmin();
    } catch (error) {
        console.error("Gagal mengubah status: ", error);
        Swal.fire({ icon: 'error', title: 'Gagal', text: 'Tidak dapat memperbarui status.' });
    }
}

muatDataSiswa();