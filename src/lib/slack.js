
/**
 * @param {string} action 
 * @param {string} userName 
 * @param {string} [details=""]
 * @param {Object} [options] 
 * @param {string} [options.emoji=""] 
 */
export async function notifySlack(action, userName, details = '', options = {}) {
  const { emoji = '' } = options;

  const payload = {
    action,
    userName: userName || 'Anonymous',
    details,
    timestamp: new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' }) + ' WAT',
    emoji,
  };

  try {
    const res = await fetch('/api/slack-notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Slack API responded with ${res.status}`);
    }

    console.log(`Slack notification sent: ${action}`);
  } catch (err) {
    console.error('Failed to send Slack notification:', err);
  }
}

export function notifyIssueCreated(userName, issueTitle, category) {
  notifySlack(
    'created new issue',
    userName,
    `Title: ${issueTitle}\nCategory: ${category || 'Not specified'}`,
    { emoji: '📝' }
  );
}

export function notifyCardMoved(userName, issueTitle, fromStatus, toStatus) {
  notifySlack(
    `moved issue from ${fromStatus} → ${toStatus}`,
    userName,
    `Issue: ${issueTitle}`,
    { emoji: '🔄' }
  );
}

	export function notifyDeleted(userName, itemTitle, itemType = 'issue') {
  notifySlack(
    `permanently deleted ${itemType}`,
    userName,
    `${itemType.charAt(0).toUpperCase() + itemType.slice(1)}: ${itemTitle}`,
    '🗑️'
  );
}

export function notifyCommentAdded(userName, issueTitle, commentSnippet) {
  notifySlack(
    'added a comment',
    userName,
    `On issue: ${issueTitle}\n"${commentSnippet.substring(0, 80)}${commentSnippet.length > 80 ? '...' : ''}"`,
    { emoji: '💬' }
  );
}

export function notifySolutionUpdated(userName, recordTitle) {
  notifySlack(
    'updated solution/improvement',
    userName,
    `Record: ${recordTitle}`,
    { emoji: '🛠️' }
  );
}

export function notifyArchived(userName, itemTitle, itemType = 'issue') {
  notifySlack(
    `archived ${itemType}`,
    userName,
    `${itemType.charAt(0).toUpperCase() + itemType.slice(1)}: ${itemTitle}`,
    { emoji: '📦' }
  );
}

export function notifyUnarchived(userName, itemTitle, itemType = 'issue') {
  notifySlack(
    `unarchived ${itemType}`,
    userName,
    `${itemType.charAt(0).toUpperCase() + itemType.slice(1)}: ${itemTitle}`,
    { emoji: '♻️' }
  );
}