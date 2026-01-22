import {
  collection,
  addDoc,
  doc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  arrayUnion,
  deleteDoc,
  getDoc,
} from 'firebase/firestore';
import { db } from './firebase';
export async function createInnovation(data) {
  try {
    const docRef = await addDoc(collection(db, 'innovations'), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: data.status || 'Completed',
    });
    return docRef;
  } catch (error) {
    console.error('Error creating innovation:', error);
    throw error;
  }
}

export function getInnovationsWithListener(callback, errorCallback = console.error) {
  const q = query(collection(db, 'innovations'), orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const innovations = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      callback(innovations);
    },
    (error) => {
      console.error('Error listening to innovations:', error);
      if (errorCallback) errorCallback(error);
    }
  );
}

export async function getInnovation(id) {
  const ref = doc(db, 'innovations', id);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() };
  }
  return null;
}

export async function updateInnovation(id, data) {
  const ref = doc(db, 'innovations', id);
  try {
    await updateDoc(ref, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating innovation:', error);
    throw error;
  }
}

export async function updateSolutionWithHistory(id, newText, updater) {
  const ref = doc(db, 'innovations', id);

  const historyEntry = {
    text: newText,
    updatedBy: {
      uid: updater.uid,
      name: updater.name,
    },
    updatedAt: new Date(),   };

  try {
    await updateDoc(ref, {
      currentSolution: newText,
      solutionHistory: arrayUnion(historyEntry),
      solver: {
        uid: updater.uid,
        name: updater.name,
      },
      status: 'Solved',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating solution history:', error);
    throw error;
  }
}

export async function addParticipant(id, participant) {
  const ref = doc(db, 'innovations', id);
  try {
    await updateDoc(ref, {
      participants: arrayUnion(participant),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error adding participant:', error);
    throw error;
  }
}

export async function updateStatus(id, newStatus) {
  const ref = doc(db, 'innovations', id);
  try {
    await updateDoc(ref, {
      status: newStatus,
      updatedAt: serverTimestamp(),
      ...(newStatus === 'Completed' ? { endDate: serverTimestamp() } : {}),
    });
  } catch (error) {
    console.error('Error updating status:', error);
    throw error;
  }
}

export async function addComment(innovationId, commentData) {
  const commentsColl = collection(db, 'innovations', innovationId, 'comments');
  try {
    await addDoc(commentsColl, {
      ...commentData,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
}

export function getCommentsWithListener(innovationId, callback, errorCallback = console.error) {
  const q = query(
    collection(db, 'innovations', innovationId, 'comments'),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const comments = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      callback(comments);
    },
    (error) => {
      console.error('Error listening to comments:', error);
      if (errorCallback) errorCallback(error);
    }
  );
}

export async function deleteInnovation(id) {
  const ref = doc(db, 'innovations', id);
  try {
    await deleteDoc(ref);
  } catch (error) {
    console.error('Error deleting innovation:', error);
    throw error;
  }
}