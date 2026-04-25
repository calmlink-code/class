const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ミドルウェア設定
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cors());

// MongoDB接続
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// 予約データのスキーマ定義（1回にまとめました）
const reservationSchema = new mongoose.Schema({
  parentName: String,
  childName: String,
  address: String,
  phoneNumber: String,
  birthDate: String,
  grade: String,
  reservationDate: String, // 追加した項目
  createdAt: { type: Date, default: Date.now }
});

const Reservation = mongoose.model('Reservation', reservationSchema);

// 1. 人数チェック用API（カレンダー選択時に使用）
app.get('/api/check-date', async (req, res) => {
  const { date } = req.query;
  try {
    const count = await Reservation.countDocuments({ reservationDate: date });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: "カウント失敗", detail: error.message });
  }
});

// 2. 予約情報の保存API（4人制限チェック付き）
app.post('/api/reserve', async (req, res) => {
  try {
    const { reservationDate } = req.body;
    
    // 保存前にその日の人数を再チェック
    const count = await Reservation.countDocuments({ reservationDate });
    if (count >= 4) {
      return res.status(400).json({ message: '申し訳ありません、この日は既に満員です。' });
    }

    const newReservation = new Reservation(req.body);
    await newReservation.save();
    res.status(200).json({ message: '予約が完了しました' });
  } catch (error) {
    res.status(500).json({ message: 'エラーが発生しました', detail: error.message });
  }
});

// 3. 管理者用のデータ取得API
app.get('/api/admin/reservations', async (req, res) => {
  try {
    const reservations = await Reservation.find().sort({ createdAt: -1 });
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ message: '取得失敗', detail: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
