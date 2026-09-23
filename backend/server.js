const express = require('express');
const cors = require('cors');
const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

// アカウント（インスタンス）の初期設定
let users = [
  { id: 'a', name: 'User A', points: 0, streak: 0, lastStudyDate: null },
  { id: 'b', name: 'User B', points: 0, streak: 0, lastStudyDate: null },
  { id: 'c', name: 'User C', points: 0, streak: 0, lastStudyDate: null },
  { id: 'd', name: 'User D', points: 0, streak: 0, lastStudyDate: null },
  { id: 'e', name: 'User E', points: 0, streak: 0, lastStudyDate: null },
];

// 学習カテゴリーの初期設定
let categories = ['プログラミング', '研究活動', '語学学習', '就職活動'];

// API: ユーザー一覧（ランキング順）の取得
app.get('/api/users', (req, res) => {
  const rankedUsers = [...users].sort((a, b) => b.points - a.points);
  res.json(rankedUsers);
});

// API: カテゴリー一覧の取得
app.get('/api/categories', (req, res) => {
  res.json(categories);
});

// API: 新しいカテゴリーの追加
app.post('/api/categories', (req, res) => {
  const newCategory = typeof req.body.newCategory === 'string'
    ? req.body.newCategory.trim()
    : '';

  if (!newCategory) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  if (newCategory.length > 50) {
    return res.status(400).json({ error: 'Category name is too long' });
  }

  if (!categories.includes(newCategory)) {
    categories.push(newCategory);
  }
  res.json(categories);
});

// API: 活動記録の登録とポイント計算
app.post('/api/activity', (req, res) => {
  const { userId, hours, minutes, isAchievement, category } = req.body;
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) return res.status(404).json({ error: 'User not found' });

  const parsedHours = Number(hours);
  const parsedMinutes = Number(minutes);
  if (!Number.isInteger(parsedHours) || parsedHours < 0 || parsedHours > 24) {
    return res.status(400).json({ error: 'Hours must be an integer from 0 to 24' });
  }
  if (!Number.isInteger(parsedMinutes) || parsedMinutes < 0 || parsedMinutes > 59) {
    return res.status(400).json({ error: 'Minutes must be an integer from 0 to 59' });
  }
  if (parsedHours === 0 && parsedMinutes === 0) {
    return res.status(400).json({ error: 'Study time must be greater than zero' });
  }
  if (category !== undefined && !categories.includes(category)) {
    return res.status(400).json({ error: 'Unknown category' });
  }

  const user = users[userIndex];
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  let earnedPoints = 0;

  // 1. 学習時間ポイント (10分につき1pt)
  const totalMinutes = parsedHours * 60 + parsedMinutes;
  earnedPoints += Math.floor(totalMinutes / 10);

  // 2. 成果ボーナス (50pt)
  if (isAchievement) {
    earnedPoints += 50;
  }

  // 3. 継続ボーナス
  if (user.lastStudyDate === yesterday) {
    user.streak += 1;
    earnedPoints += user.streak * 5; // 連続日数×5ptのボーナス
  } else if (user.lastStudyDate !== today) {
    user.streak = 1;
  }
  user.lastStudyDate = today;

  user.points += earnedPoints;

  res.json({ success: true, earnedPoints, user });
});

app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});