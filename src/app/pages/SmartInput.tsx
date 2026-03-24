import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { categories } from "../lib/mockData";
import { ChevronLeft, Camera, Mic, Upload, Check, Edit, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export function SmartInput() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") || "voice";
  
  const [activeTab, setActiveTab] = useState(initialMode);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [extractedData, setExtractedData] = useState({
    amount: "",
    description: "",
    category: "",
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Mock voice recognition
  const handleVoiceRecord = () => {
    if (isRecording) {
      setIsRecording(false);
      // Simulate voice recognition
      const mockTranscripts = [
        { text: "Ăn bún bò 35 nghìn", amount: "35000", description: "Bún bò", category: "Ăn uống" },
        { text: "Mua quần áo 150 nghìn", amount: "150000", description: "Quần áo", category: "Mua sắm" },
        { text: "Đi grab 50 nghìn", amount: "50000", description: "Grab", category: "Di chuyển" },
        { text: "Xem phim 200 nghìn", amount: "200000", description: "Xem phim", category: "Giải trí" },
      ];
      
      const randomTranscript = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];
      setVoiceTranscript(randomTranscript.text);
      setExtractedData({
        amount: randomTranscript.amount,
        description: randomTranscript.description,
        category: randomTranscript.category,
      });
      toast.success("Đã nhận diện giọng nói thành công");
    } else {
      setIsRecording(true);
      toast.info("Bắt đầu ghi âm...");
    }
  };

  // Mock OCR processing
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
        processOCR();
      };
      reader.readAsDataURL(file);
    }
  };

  const processOCR = () => {
    setIsProcessing(true);
    
    // Simulate OCR processing
    setTimeout(() => {
      const mockOCRResults = [
        { 
          amount: "85000", 
          description: "Cà phê", 
          category: "Ăn uống",
          storeName: "Highlands Coffee",
          confidence: 95 
        },
        { 
          amount: "250000", 
          description: "Áo thun", 
          category: "Mua sắm",
          storeName: "Uniqlo",
          confidence: 92 
        },
        { 
          amount: "120000", 
          description: "Trà sữa", 
          category: "Ăn uống",
          storeName: "Gong Cha",
          confidence: 88 
        },
      ];
      
      const result = mockOCRResults[Math.floor(Math.random() * mockOCRResults.length)];
      setOcrResult(result);
      setExtractedData({
        amount: result.amount,
        description: result.description,
        category: result.category,
      });
      setIsProcessing(false);
      toast.success("Đã quét hóa đơn thành công");
    }, 2000);
  };

  const handleSaveTransaction = () => {
    if (!extractedData.amount || !extractedData.description || !extractedData.category) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    toast.success("Đã lưu giao dịch thành công");
    setTimeout(() => navigate("/transactions"), 1000);
  };

  return (
    <div className="max-w-md mx-auto min-h-screen pb-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-slate-100 p-6 border-b border-slate-800">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => navigate("/")}
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl">Nhập liệu thông minh</h1>
        </div>
        <p className="text-sm opacity-90">
          Nhập giao dịch nhanh chóng bằng giọng nói hoặc quét hóa đơn
        </p>
      </div>

      {/* Input Methods */}
      <div className="px-4 mt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 bg-slate-900 border border-slate-800">
            <TabsTrigger value="voice">
              <Mic className="w-4 h-4 mr-2" />
              Giọng nói
            </TabsTrigger>
            <TabsTrigger value="scan">
              <Camera className="w-4 h-4 mr-2" />
              Quét hóa đơn
            </TabsTrigger>
          </TabsList>

          {/* Voice Input */}
          <TabsContent value="voice" className="space-y-6">
            <Card className="p-6 bg-slate-900 border-slate-800">
              <div className="text-center space-y-4">
                <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center transition-all ${
                  isRecording ? "bg-rose-500/20 animate-pulse" : "bg-cyan-500/20"
                }`}>
                  <Mic className={`w-12 h-12 ${isRecording ? "text-rose-300" : "text-cyan-300"}`} />
                </div>
                
                <div>
                  <p className="text-sm text-slate-400 mb-2">
                    {isRecording ? "Đang ghi âm..." : "Nhấn để bắt đầu ghi âm"}
                  </p>
                  <Button
                    size="lg"
                    onClick={handleVoiceRecord}
                    variant={isRecording ? "destructive" : "default"}
                  >
                    {isRecording ? "Dừng ghi âm" : "Bắt đầu"}
                  </Button>
                </div>

                {voiceTranscript && (
                  <div className="mt-4 p-4 bg-slate-800 rounded-lg border border-slate-700">
                    <p className="text-sm text-slate-400 mb-1">Đã nhận diện:</p>
                    <p className="text-lg text-slate-100">{voiceTranscript}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-3">
                <div className="p-3 bg-cyan-900/20 border border-cyan-700/30 rounded-lg">
                  <h3 className="text-sm mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-cyan-300" />
                    Hướng dẫn sử dụng
                  </h3>
                  <ul className="text-xs text-slate-300 space-y-1">
                    <li>• Nói rõ ràng: "Ăn bún bò 35 nghìn"</li>
                    <li>• Hoặc: "Mua quần áo 150 nghìn"</li>
                    <li>• AI sẽ tự động tách nội dung và số tiền</li>
                  </ul>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* OCR Scan */}
          <TabsContent value="scan" className="space-y-6">
            <Card className="p-6 bg-slate-900 border-slate-800">
              {!uploadedImage ? (
                <div className="text-center space-y-4">
                  <div className="w-24 h-24 mx-auto rounded-full bg-violet-500/20 flex items-center justify-center">
                    <Camera className="w-12 h-12 text-violet-300" />
                  </div>
                  
                  <div>
                    <p className="text-sm text-slate-400 mb-4">
                      Chụp hoặc tải lên ảnh hóa đơn
                    </p>
                    <label htmlFor="image-upload">
                      <Button asChild>
                        <span>
                          <Upload className="w-4 h-4 mr-2" />
                          Tải ảnh lên
                        </span>
                      </Button>
                    </label>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </div>

                  <div className="mt-6 p-3 bg-violet-900/20 border border-violet-700/30 rounded-lg">
                    <h3 className="text-sm mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-violet-300" />
                      Mẹo chụp hóa đơn tốt
                    </h3>
                    <ul className="text-xs text-slate-300 space-y-1">
                      <li>• Đảm bảo ánh sáng đủ, hóa đơn rõ nét</li>
                      <li>• Chụp thẳng góc, không bị méo</li>
                      <li>• Phần tổng tiền phải rõ ràng</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <img
                      src={uploadedImage}
                      alt="Uploaded receipt"
                      className="w-full rounded-lg"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setUploadedImage(null);
                        setOcrResult(null);
                        setExtractedData({ amount: "", description: "", category: "" });
                      }}
                    >
                      Chọn ảnh khác
                    </Button>
                  </div>

                  {isProcessing && (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 mx-auto mb-3 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-slate-400">Đang xử lý hóa đơn...</p>
                    </div>
                  )}

                  {ocrResult && !isProcessing && (
                    <div className="p-4 bg-emerald-900/20 border border-emerald-700/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <Check className="w-5 h-5 text-green-600" />
                        <p className="text-sm">
                          Đã nhận diện (Độ chính xác: {ocrResult.confidence}%)
                        </p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="text-slate-400">Cửa hàng:</span> {ocrResult.storeName}
                        </p>
                        <p>
                          <span className="text-slate-400">Tổng tiền:</span> {formatCurrency(parseFloat(ocrResult.amount))}
                        </p>
                        <p>
                          <span className="text-slate-400">Danh mục gợi ý:</span> {ocrResult.category}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>

        {/* Extracted Data Form */}
        {(extractedData.amount || extractedData.description) && (
          <Card className="p-6 mt-6 bg-slate-900 border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <Edit className="w-5 h-5 text-cyan-300" />
              <h3 className="text-lg text-slate-100">Xác nhận thông tin</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="amount">Số tiền</Label>
                <Input
                  id="amount"
                  type="number"
                  value={extractedData.amount}
                  onChange={(e) => setExtractedData({ ...extractedData, amount: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="description">Mô tả</Label>
                <Input
                  id="description"
                  value={extractedData.description}
                  onChange={(e) => setExtractedData({ ...extractedData, description: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="category">Danh mục</Label>
                <Select 
                  value={extractedData.category} 
                  onValueChange={(value) => setExtractedData({ ...extractedData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .filter(c => !["Tiền lương", "Đầu tư"].includes(c.name))
                      .map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full" size="lg" onClick={handleSaveTransaction}>
                <Check className="w-5 h-5 mr-2" />
                Lưu giao dịch
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
