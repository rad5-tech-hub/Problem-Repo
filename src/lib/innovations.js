
import { collection, addDoc, doc, updateDoc, onSnapshot, query, orderBy, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { db } from './firebase';

export async function createInnovation(data) {
  return addDoc(collection(db, 'innovations'), {
    ...data,
    status: 'Unattended', 
    createdAt: serverTimestamp(),
    startDate: serverTimestamp(),
    participants: [], 
    comments: [], 
  });
}
export function getInnovationsWithListener(callback) {
  const q = query(collection(db, 'innovations'), orderBy('startDate', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const innovations = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(innovations);
  });
}

export async function updateInnovation(id, data, solver = null) {
  const ref = doc(db, 'innovations', id);
  const updateData = {
    ...data,
    updatedAt: serverTimestamp(),
  };

  if (solver) {
    updateData.solver = {
      uid: solver.uid,
      name: solver.name,
    };
  }

  await updateDoc(ref, updateData);
}

export async function addParticipant(id, { uid, name }) {
  const ref = doc(db, 'innovations', id);
  await updateDoc(ref, {
    participants: arrayUnion({ uid, name, role: 'participant' }),
    status: 'In Progress', 
    updatedAt: serverTimestamp(),
  });
}

export async function updateStatus(id, newStatus) {
  const ref = doc(db, 'innovations', id);
  await updateDoc(ref, {
    status: newStatus,
    updatedAt: serverTimestamp(),
    // Optional: auto-set endDate if changing to Completed
    ...(newStatus === 'Completed' ? { endDate: serverTimestamp() } : {}),
  });
}

export async function addComment(innovationId, commentData) {
  const commentsColl = collection(db, 'innovations', innovationId, 'comments');
  await addDoc(commentsColl, {
    ...commentData,
    createdAt: serverTimestamp(),
  });
}

export function getCommentsWithListener(innovationId, callback) {
  const q = query(collection(db, 'innovations', innovationId, 'comments'), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(comments);
  });
}

export async function updateSolution(id, solution, solver) {
  const ref = doc(db, 'innovations', id);
  await updateDoc(ref, {
    solution,
    solver: { uid: solver.uid, name: solver.name }, 
    status: 'Solved', 
    updatedAt: serverTimestamp(),
  });
}