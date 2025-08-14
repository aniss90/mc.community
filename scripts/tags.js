// js/tags.js
export const tagNames = {
  'admin': 'ADMIN',
  'moderator': 'MOD',
  'vip': 'VIP',
  'builder': 'BUILDER',
  'friend': 'FRIEND',
  'legend': 'LEGEND',
  'youtuber': 'YOUTUBER',
  'mvp': 'MVP',
  "owner": 'OWNER', 
  'hira_user': '🌸'
};

export function getTagName(tagId) {
  return tagNames[tagId] || tagId;
}

export function getAllTagIds() {
  return Object.keys(tagNames);
}