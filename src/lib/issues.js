import { collection, addDoc, doc, updateDoc, arrayUnion, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export async function createIssue(data) {
  return addDoc(collection(db, 'issues'), {
    ...data,
    status: 'Open',
    assignees: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
export async function addAssignee(issueId, user) {
  const ref = doc(db, 'issues', issueId);

  // Create the assignee object WITHOUT serverTimestamp inside arrayUnion
  const newAssignee = {
    uid: user.uid,
    name: user.displayName || user.email.split('@')[0] || 'Anonymous',
    // Use client-side timestamp for assignedAt (very accurate in practice)
    assignedAt: new Date().toISOString(),
  };

  try {
    // First get current assignees count to decide if we should change status
    const issueSnap = await getDoc(ref);
    if (!issueSnap.exists()) {
      throw new Error('Issue not found');
    }

    const currentAssignees = issueSnap.data().assignees || [];
    const shouldSetInProgress = currentAssignees.length === 0;

    await updateDoc(ref, {
      assignees: arrayUnion(newAssignee),
      updatedAt: serverTimestamp(),
      ...(shouldSetInProgress ? { status: 'In Progress' } : {}),
    });

    return true; // Success
  } catch (error) {
    console.error('Error adding assignee:', error);
    throw error;
  }
}