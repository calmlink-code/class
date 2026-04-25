const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ミドルウェア設定
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // publicフォルダ内のHTMLを表示
app.use(cors()); // GitHub Pagesからのアクセスを許可するために必要

// MongoDB接続 (Renderの環境変数から取得)
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// 予約データのスキーマ定義
const reservationSchema = new mongoose.Schema({
  parentName: String,
  childName: String,
  address: String,
  phoneNumber: String,
  birthDate: String,
  grade: String,
  createdAt: { type: Date, default: Date.now }
});

const Reservation = mongoose.model('Reservation', reservationSchema);

// 予約情報の保存API
app.post('/api/reserve', async (req, res) => {
  try {
    const newReservation = new Reservation(req.body);
    await newReservation.save();
    res.status(200).json({ message: '予約が完了しました' });
  } catch (error) {
    res.status(500).json({ message: 'エラーが発生しました' });
  }
});

// 1. スキーマに予約日の項目を追加
const reservationSchema = new mongoose.Schema({
    // ...これまでの項目
    reservationDate: String, // "2026-04-25" のような形式
});

// 2. 人数チェック用APIの作成
app.get('/api/check-date', async (req, res) => {
    const { date } = req.query;
    try {
        // その日の予約件数をカウントする
        const count = await Reservation.countDocuments({ reservationDate: date });
        res.json({ count });
    } catch (error) {
        res.status(500).json({ error: "カウント失敗" });
    }
});

// 3. 予約保存時にも「4人以下」か再チェックする（念のため）
app.post('/api/reservations', async (req, res) => {
    const { reservationDate } = req.body;
    const count = await Reservation.countDocuments({ reservationDate });
    if (count >= 4) {
        return res.status(400).json({ message: "この日は既に満員です" });
    }
    // ...保存処理へ
});

// 管理者用のデータ取得API (GitHub Pagesから呼び出す)
app.get('/api/admin/reservations', async (req, res) => {
  try {
    const reservations = await Reservation.find().sort({ createdAt: -1 });
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ message: '取得失敗' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
