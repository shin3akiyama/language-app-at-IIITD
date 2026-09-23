import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api`;

function App() {
  // データ管理用
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // フォーム入力用
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [isAchievement, setIsAchievement] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // サーバーからデータを取得する関数
  const fetchData = useCallback(async () => {
    try {
      const usersRes = await axios.get(`${API_URL}/users`);
      setUsers(usersRes.data);
      setSelectedUser(current => current || usersRes.data[0]?.id || '');

      const catRes = await axios.get(`${API_URL}/categories`);
      setCategories(catRes.data);
      setSelectedCategory(current => current || catRes.data[0] || '');
      
      setLoading(false);
    } catch (error) {
      console.error("通信エラー:", error);
      setLoading(false);
    }
  }, []);

  // 画面が表示された時に一度だけ実行
  useEffect(() => {
    const timeoutId = setTimeout(fetchData, 0);
    return () => clearTimeout(timeoutId);
  }, [fetchData]);

  // 記録を送信する処理
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/activity`, {
        userId: selectedUser,
        category: selectedCategory,
        hours,
        minutes,
        isAchievement
      });
      alert(`記録完了！ +${res.data.earnedPoints}ポイント獲得！`);
      fetchData(); // ランキングを更新
      // 入力リセット
      setHours(0);
      setMinutes(0);
      setIsAchievement(false);
    } catch {
      alert("送信に失敗しました");
    }
  };

  // 新しいカテゴリーを追加する処理
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      await axios.post(`${API_URL}/categories`, { newCategory: newCategoryName });
      setNewCategoryName('');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || 'カテゴリの追加に失敗しました');
    }
  };

  if (loading) return <div style={{ padding: '40px' }}>読み込み中... サーバーを起動してください。</div>;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px', fontFamily: '"Helvetica Neue", Arial, sans-serif' }}>
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', color: '#333' }}>🚀 Dev-Ranking App</h1>
        <p style={{ color: '#666' }}>切磋琢磨して学習効率を最大化しよう</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
        
        {/* 左側：入力ジャーナル */}
        <div style={{ background: '#fff', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
          <h2 style={{ borderBottom: '2px solid #007bff', paddingBottom: '10px' }}>✍️ 今日の活動を記録</h2>
          <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontWeight: 'bold' }}>アカウントを選択</label>
              <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)} style={{ width: '100%', padding: '10px', marginTop: '5px' }}>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontWeight: 'bold' }}>学習内容</label>
              <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} style={{ width: '100%', padding: '10px', marginTop: '5px' }}>
                {categories.map((cat, i) => <option key={i} value={cat}>{cat}</option>)}
              </select>
              <div style={{ marginTop: '10px', display: 'flex', gap: '5px' }}>
                <input 
                  type="text" 
                  value={newCategoryName} 
                  onChange={e => setNewCategoryName(e.target.value)} 
                  placeholder="新しいカテゴリ" 
                  style={{ flex: 1, padding: '5px' }}
                />
                <button type="button" onClick={handleAddCategory}>追加</button>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontWeight: 'bold', display: 'block' }}>学習時間</label>
              <input type="number" value={hours} onChange={e => setHours(e.target.value)} style={{ width: '60px', padding: '10px' }} /> 時間
              <input type="number" value={minutes} onChange={e => setMinutes(e.target.value)} style={{ width: '60px', padding: '10px', marginLeft: '10px' }} /> 分
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input type="checkbox" checked={isAchievement} onChange={e => setIsAchievement(e.target.checked)} style={{ marginRight: '10px' }} />
                🎉 何か成果が出た！ (ボーナス50pt)
              </label>
            </div>

            <button type="submit" style={{ width: '100%', padding: '15px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1.1rem', cursor: 'pointer' }}>
              ポイントを獲得する
            </button>
          </form>
        </div>

        {/* 右側：ランキング表示 */}
        <div style={{ background: '#f8f9fa', padding: '30px', borderRadius: '15px' }}>
          <h2 style={{ borderBottom: '2px solid #28a745', paddingBottom: '10px' }}>🏆 リアルタイムランキング</h2>
          <div style={{ marginTop: '20px' }}>
            {users.map((user, index) => (
              <div key={user.id} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '15px', 
                background: '#fff', 
                marginBottom: '10px', 
                borderRadius: '10px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
              }}>
                <div>
                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold', marginRight: '15px' }}>{index + 1}位</span>
                  <span style={{ fontSize: '1.1rem' }}>{user.name}</span>
                  {user.streak > 1 && (
                    <span style={{ marginLeft: '10px', color: '#dc3545', fontSize: '0.9rem', fontWeight: 'bold' }}>
                      🔥 {user.streak}日連続！
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#007bff' }}>
                  {user.points} <span style={{ fontSize: '0.8rem', color: '#666' }}>pt</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;