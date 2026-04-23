import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { motion, AnimatePresence } from "motion/react";
import {
  Camera,
  Mic,
  Upload,
  Check,
  Edit,
  Sparkles,
  PenLine,
  StopCircle,
  X,
  Keyboard,
  ArrowRight,
  Image as ImageIcon,
  Calendar as CalendarIcon,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useLocale } from "../lib/locale";
import { 
  createVoiceDraft, 
  createOcrDraft, 
  updateSmartInputDraft,
  confirmSmartInputDraft,
  SmartInputDraftResponse 
} from "../lib/api/smartInput";
import { listCategories, CategoryResponse } from "../lib/api/categories";
import { createTransaction } from "../lib/api/transactions";

export function SmartInput() {
  const navigate = useNavigate();
  const { t } = useLocale();
  const [searchParams] = useSearchParams();
  
  const [mode, setMode] = useState<"idle" | "voice" | "scan" | "manual" | "camera">("idle");
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getLocalDate = () => {
    const now = new Date();
    return new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
  };

  const [extractedData, setExtractedData] = useState({
    amount: "",
    description: "",
    categoryId: "",
    date: getLocalDate(),
  });

  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    listCategories().then(res => setCategories(res.items)).catch(console.error);
    const initialMode = searchParams.get("mode");
    if (initialMode === "scan") setMode("scan");
    else if (initialMode === "voice") setMode("voice");
    else if (initialMode === "manual") setMode("manual");
    
    return () => stopCamera();
  }, [searchParams]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const resetAll = () => {
    stopCamera();
    if (isRecording && mediaRecorder) {
      mediaRecorder.onstop = null;
      if (mediaRecorder.state !== "inactive") mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    setMode("idle");
    setIsRecording(false);
    setIsProcessing(false);
    setCurrentDraftId(null);
    setUploadedImage(null);
    setExtractedData({ 
      amount: "", 
      description: "", 
      categoryId: "", 
      date: getLocalDate() 
    });
    setFormErrors({});
    chunksRef.current = [];
  };

  const getAmountFontSize = (length: number) => {
    if (length <= 5) return "text-5xl";
    if (length <= 8) return "text-4xl";
    if (length <= 11) return "text-3xl";
    return "text-2xl";
  };

  // Improved Industry Standard WAV Encoder
  const bufferToWav = (buffer: AudioBuffer) => {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const arrayBuffer = new ArrayBuffer(length);
    const view = new DataView(arrayBuffer);
    let pos = 0;

    const setUint16 = (data: number) => { view.setUint16(pos, data, true); pos += 2; };
    const setUint32 = (data: number) => { view.setUint32(pos, data, true); pos += 4; };

    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8);
    setUint32(0x45564157); // "WAVE"
    setUint32(0x20746d66); // "fmt "
    setUint32(16); setUint16(1); setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2); setUint16(16);
    setUint32(0x61746164); // "data"
    setUint32(length - pos - 4);

    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numOfChan; channel++) {
        let sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        view.setInt16(pos, (sample < 0 ? sample * 0x8000 : sample * 0x7fff) | 0, true);
        pos += 2;
      }
    }
    return new Blob([arrayBuffer], { type: "audio/wav" });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        if (chunksRef.current.length === 0) return;
        const audioBlob = new Blob(chunksRef.current, { type: recorder.mimeType });
        setIsProcessing(true);
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const arrayBuffer = await audioBlob.arrayBuffer();
          const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
          const wavBlob = bufferToWav(audioBuffer);
          const draft = await createVoiceDraft(new File([wavBlob], "voice.wav", { type: "audio/wav" }));
          setCurrentDraftId(draft.id);
          setExtractedData({
            ...extractedData,
            amount: draft.parsed_amount_minor ? String(draft.parsed_amount_minor) : "",
            description: draft.parsed_description || "",
            categoryId: draft.suggested_category?.id || "",
          });
        } catch (error) { toast.error("AI không nhận diện được âm thanh."); }
        finally { setIsProcessing(false); stream.getTracks().forEach(t => t.stop()); }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) { toast.error("Lỗi Microphone"); }
  };

  const startCamera = async () => {
    setMode("camera");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      toast.error("Không thể mở Camera");
      setMode("scan");
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg");
    setUploadedImage(dataUrl);
    canvas.toBlob(async (blob) => {
      if (blob) await processOcrFile(new File([blob], "capture.jpg", { type: "image/jpeg" }));
    }, "image/jpeg", 0.9);
    stopCamera();
  };

  const processOcrFile = async (file: File) => {
    setIsProcessing(true);
    try {
      const draft = await createOcrDraft(file);
      setCurrentDraftId(draft.id);
      setExtractedData({
        ...extractedData,
        amount: draft.parsed_amount_minor ? String(draft.parsed_amount_minor) : "",
        description: draft.parsed_description || "",
        categoryId: draft.suggested_category?.id || "",
      });
    } catch (error) { toast.error("AI không đọc được hóa đơn"); }
    finally { setIsProcessing(false); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setUploadedImage(ev.target?.result as string);
      reader.readAsDataURL(file);
      await processOcrFile(file);
    }
  };

  const handleSave = async () => {
    const errors: Record<string, boolean> = {};
    if (!extractedData.amount || parseInt(extractedData.amount) <= 0) errors.amount = true;
    if (!extractedData.description.trim()) errors.description = true;
    if (!extractedData.categoryId) errors.categoryId = true;
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Vui lòng điền đủ thông tin", { style: { zIndex: 10001 } });
      return;
    }

    setIsProcessing(true);
    try {
      if (mode === "manual") {
        await createTransaction({
          amount_minor: parseInt(extractedData.amount),
          description: extractedData.description,
          category_id: extractedData.categoryId,
          type: "expense",
          transaction_date: extractedData.date,
          source: "manual"
        });
      } else if (currentDraftId) {
        await updateSmartInputDraft(currentDraftId, {
          parsed_amount_minor: parseInt(extractedData.amount),
          parsed_description: extractedData.description,
          suggested_category_id: extractedData.categoryId,
        });
        await confirmSmartInputDraft(currentDraftId, { transaction_date: extractedData.date });
      }
      toast.success("Đã ghi chép xong!");
      setTimeout(() => navigate("/transactions"), 800);
    } catch (error) { toast.error("Lỗi khi lưu"); }
    finally { setIsProcessing(false); }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-950 text-slate-100 flex flex-col px-6 pt-8 pb-12 relative overflow-hidden">
      <div className="absolute top-[-5%] -left-1/4 w-full h-1/2 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="mb-8 relative z-10 text-left">
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
          {mode === "idle" ? "Chào bạn!" : mode === "voice" ? "Ghi âm" : mode === "camera" ? "Chụp ảnh" : mode === "manual" ? "Tự ghi chép" : "Quét biên lai"}
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-slate-400 mt-1 text-base">
          {mode === "idle" ? "Hôm nay bạn chi tiêu gì thế?" : "Hãy hoàn thiện các thông tin bên dưới."}
        </motion.p>
      </div>

      <AnimatePresence mode="wait">
        {mode === "idle" && (
          <motion.div key="idle-menu" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} className="grid grid-cols-1 gap-4 z-10">
            <ActionCard icon={<Mic className="w-7 h-7 text-emerald-400" />} title="Ghi âm nhanh" desc="Vừa chi gì đó? Hãy nói cho mình nhé." onClick={() => setMode("voice")} color="border-emerald-500/20 bg-emerald-500/5" />
            <ActionCard icon={<Camera className="w-7 h-7 text-cyan-400" />} title="Quét hóa đơn" desc="Chụp ảnh biên lai, AI xử lý trong tích tắc." onClick={() => setMode("scan")} color="border-cyan-500/20 bg-cyan-500/5" />
            <ActionCard icon={<Keyboard className="w-7 h-7 text-amber-400" />} title="Tự ghi chép" desc="Chủ động nhập chính xác từng con số." onClick={() => setMode("manual")} color="border-amber-500/20 bg-amber-500/5" />
          </motion.div>
        )}

        {mode === "voice" && !currentDraftId && (
          <motion.div key="voice-mode" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col items-center justify-center py-12 space-y-8 z-10">
            <div className="relative">
              <AnimatePresence>{isRecording && <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1.6, opacity: 0.2 }} exit={{ scale: 2, opacity: 0 }} transition={{ repeat: Infinity, duration: 1.5 }} className="absolute inset-0 bg-emerald-500 rounded-full" />}</AnimatePresence>
              <button onClick={isRecording ? () => {setIsRecording(false); mediaRecorder?.stop();} : startRecording} className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-2xl ${isRecording ? "bg-red-500 shadow-red-500/40" : "bg-emerald-500 shadow-emerald-500/40"}`}>
                {isRecording ? <StopCircle className="w-10 h-10 text-white" /> : <Mic className="w-10 h-10 text-white" />}
              </button>
            </div>
            <div className="text-center">
              <p className="text-lg font-medium mb-1">{isRecording ? "Mình đang nghe..." : "Sẵn sàng"}</p>
              <Button variant="ghost" className="text-slate-500 hover:text-slate-300" onClick={resetAll}>Quay lại</Button>
            </div>
          </motion.div>
        )}

        {mode === "scan" && !currentDraftId && (
          <motion.div key="scan-options" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-4 z-10">
             <ActionBox icon={<Camera className="w-8 h-8 text-cyan-400" />} label="Mở Camera" onClick={startCamera} />
             <ActionBox icon={<Upload className="w-8 h-8 text-emerald-400" />} label="Tải ảnh lên" onClick={() => fileInputRef.current?.click()} />
             <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleFileUpload} />
             <div className="col-span-2 text-center mt-4"><Button variant="ghost" className="text-slate-500" onClick={resetAll}>Quay lại</Button></div>
          </motion.div>
        )}

        {mode === "camera" && !currentDraftId && (
          <motion.div key="camera-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col space-y-6 z-10">
            <div className="relative w-full aspect-[3/4] bg-black rounded-[2.5rem] overflow-hidden border-2 border-slate-800 shadow-2xl">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            </div>
            <div className="flex items-center justify-center gap-6 pb-4">
               <button onClick={resetAll} className="w-14 h-14 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 active:scale-90 transition-transform"><X /></button>
               <button onClick={capturePhoto} className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-2xl border-8 border-slate-200 active:scale-95 transition-transform"><div className="w-12 h-12 rounded-full border-2 border-slate-800" /></button>
               <button onClick={startCamera} className="w-14 h-14 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 active:scale-90 transition-transform"><RefreshCw /></button>
            </div>
          </motion.div>
        )}

        {(currentDraftId || mode === "manual") && (
          <motion.div key="receipt-mode" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 z-10">
            {uploadedImage && <div className="w-full h-40 rounded-[2.5rem] overflow-hidden border-2 border-slate-900 shadow-xl relative"><img src={uploadedImage} alt="receipt" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" /></div>}
            <Card className="overflow-hidden bg-slate-900/80 border-slate-800 shadow-2xl rounded-[3rem] backdrop-blur-md relative">
              <div className="p-1 bg-gradient-to-r from-emerald-500/50 via-cyan-500/50 to-amber-500/50" />
              <div className="p-8 pt-10 space-y-8 text-left">
                <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-emerald-400"><Sparkles className="w-4 h-4 animate-pulse" /><span className="text-[10px] font-black uppercase tracking-[0.2em]">{mode === "manual" ? "Tự ghi chép" : "AI Phân tích"}</span></div><div className="w-12 h-px bg-slate-800" /></div>
                <div className="space-y-8">
                  <div className={`space-y-2 text-center transition-all ${formErrors.amount ? 'scale-105' : ''}`}>
                    <Label className={`text-[10px] font-bold uppercase tracking-[0.3em] ${formErrors.amount ? 'text-red-400' : 'text-slate-500'}`}>GIÁ TRỊ THANH TOÁN</Label>
                    <div className="flex items-center justify-center gap-2">
                       <span className={`text-2xl font-light ${formErrors.amount ? 'text-red-400' : 'text-emerald-500'}`}>₫</span>
                       <input type="number" autoFocus={mode === "manual"} className={`bg-transparent font-black text-white focus:outline-none w-auto max-w-[280px] text-center transition-all duration-300 ${getAmountFontSize(extractedData.amount.length)} ${formErrors.amount ? 'text-red-400' : ''}`} value={extractedData.amount} placeholder="0" onChange={(e) => {setExtractedData({...extractedData, amount: e.target.value}); setFormErrors({...formErrors, amount: false});}} />
                    </div>
                  </div>
                  <div className="space-y-5">
                    <div className="space-y-1">
                      <Label className={`text-[10px] font-bold uppercase tracking-[0.2em] ${formErrors.description ? 'text-red-400' : 'text-slate-600'}`}>Ghi chép</Label>
                      <div className={`flex items-center gap-3 border-b py-2 ${formErrors.description ? 'border-red-500/50' : 'border-slate-800'}`}>
                        <PenLine className="w-4 h-4 text-slate-700" /><input className="bg-transparent text-lg text-slate-200 focus:outline-none w-full" value={extractedData.description} onChange={(e) => {setExtractedData({...extractedData, description: e.target.value}); setFormErrors({...formErrors, description: false});}} placeholder="Vừa chi gì thế?..." />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className={`text-[10px] font-bold uppercase tracking-[0.2em] ${formErrors.categoryId ? 'text-red-400' : 'text-slate-600'}`}>Phân loại</Label>
                      <Select value={extractedData.categoryId} onValueChange={(v) => {setExtractedData({...extractedData, categoryId: v}); setFormErrors({...formErrors, categoryId: false});}}>
                        <SelectTrigger className={`bg-slate-950/40 border-2 h-14 rounded-2xl ${formErrors.categoryId ? 'border-red-500/30' : 'border-slate-800'}`}><SelectValue placeholder="Chọn danh mục" /></SelectTrigger>
                        <SelectContent className="bg-slate-950 border-slate-800 text-slate-200 rounded-2xl shadow-2xl z-[10002]">
                          {categories.filter(c => c.flow_type === "expense").map((cat) => (<SelectItem key={cat.id} value={cat.id} className="h-12 rounded-xl focus:bg-emerald-500/10 focus:text-emerald-400">{cat.name}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1 text-left"><Label className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-600 px-1">Ngày giao dịch</Label><div className="flex items-center gap-3 border-b py-2 border-slate-800"><CalendarIcon className="w-4 h-4 text-slate-700" /><input type="date" className="bg-transparent text-lg text-slate-200 focus:outline-none w-full [color-scheme:dark]" value={extractedData.date} onChange={(e) => setExtractedData({...extractedData, date: e.target.value})} /></div></div>
                  </div>
                </div>
                <div className="pt-6 flex flex-col gap-4">
                  <Button onClick={handleSave} disabled={isProcessing} className="h-16 rounded-[2rem] bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-lg shadow-2xl active:scale-[0.98]">{isProcessing ? "ĐANG LƯU..." : "HOÀN TẤT GHI CHÉP"}</Button>
                  <button onClick={resetAll} className="text-slate-600 hover:text-red-400 text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"><X className="w-3 h-3" /> Hủy bỏ & Làm lại</button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isProcessing && !currentDraftId && mode !== "manual" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-2xl">
             <div className="w-24 h-24 relative"><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="absolute inset-0 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full" /><Sparkles className="absolute inset-0 m-auto w-10 h-10 text-emerald-400 animate-pulse" /></div>
            <p className="mt-8 text-emerald-400 font-black tracking-[0.3em] animate-pulse text-sm uppercase">AI Đang Xử Lý...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ActionCard({ icon, title, desc, onClick, color }: any) {
  return (
    <motion.button whileHover={{ scale: 1.02, y: -4 }} whileTap={{ scale: 0.98 }} onClick={onClick} className={`flex items-center p-7 rounded-[2.5rem] border-2 transition-all text-left shadow-xl ${color}`}>
      <div className="mr-5 bg-slate-950/50 p-4 rounded-3xl shadow-inner border border-white/5">{icon}</div>
      <div className="flex-1"><h3 className="text-xl font-black text-slate-100 tracking-tight">{title}</h3><p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">{desc}</p></div>
      <div className="bg-slate-950/50 p-2 rounded-full opacity-30 transition-opacity"><ArrowRight className="w-4 h-4" /></div>
    </motion.button>
  );
}

function ActionBox({ icon, label, onClick }: any) {
  return (
    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onClick} className="flex flex-col items-center justify-center p-8 rounded-[2.5rem] border-2 border-dashed border-slate-900 bg-slate-900/30 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all w-full aspect-square text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-950/60 flex items-center justify-center mb-4 shadow-xl border border-white/5">{icon}</div>
      <span className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</span>
    </motion.button>
  );
}
