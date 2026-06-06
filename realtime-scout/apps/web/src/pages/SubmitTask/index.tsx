import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLocation } from '../../hooks/useLocation';
import { taskApi } from '../../services';
import './SubmitTask.css';

export default function SubmitTask() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lng, lat } = useLocation();
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [photoCount, setPhotoCount] = useState(1);

  useEffect(() => {
    taskApi.getById(parseInt(id!)).then((res: any) => {
      setPhotoCount(res.data?.photo_count || 1);
    });
  }, [id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selected]);
    const newPreviews = selected.map((f) => URL.createObjectURL(f));
    setPreviews((prev) => [...prev, ...newPreviews]);
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setVideos((prev) => [...prev, ...selected]);
    const newPreviews = selected.map((f) => URL.createObjectURL(f));
    setVideoPreviews((prev) => [...prev, ...newPreviews]);
    e.target.value = '';
  };

  const removeVideo = (index: number) => {
    setVideos((prev) => prev.filter((_, i) => i !== index));
    setVideoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (files.length < photoCount) {
      alert(`请至少上传${photoCount}张照片`);
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append('photos', f));
      videos.forEach((f) => formData.append('photos', f));
      formData.append('description', description);
      formData.append('lng', String(lng));
      formData.append('lat', String(lat));

      await taskApi.submit(parseInt(id!), formData);
      alert('提交成功！');
      navigate(`/task/${id}`, { replace: true });
    } catch (err: any) {
      alert(err.message || '提交失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="submit-page">
      <div className="submit-content">
        <h2>提交任务结果</h2>

        <div className="submit-section">
          <h3>上传现场照片</h3>
          <p className="submit-hint">请拍摄清晰的现场照片，至少{photoCount}张</p>
          <div className="photo-grid">
            {previews.map((url, i) => (
              <div key={i} className="photo-item">
                <img src={url} alt="" />
                <button className="photo-remove" onClick={() => removeFile(i)}>×</button>
              </div>
            ))}
            {files.length < 9 && (
              <label className="photo-add">
                <span>+</span>
                <span>添加照片</span>
                <input type="file" accept="image/*" multiple onChange={handleFileChange} hidden />
              </label>
            )}
          </div>
        </div>

        <div className="submit-section">
          <h3>上传视频（选填）</h3>
          <p className="submit-hint">可上传现场视频，最多3个</p>
          <div className="photo-grid">
            {videoPreviews.map((url, i) => (
              <div key={i} className="photo-item video-item">
                <video src={url} />
                <button className="photo-remove" onClick={() => removeVideo(i)}>×</button>
              </div>
            ))}
            {videos.length < 3 && (
              <label className="photo-add">
                <span>+</span>
                <span>添加视频</span>
                <input type="file" accept="video/*" onChange={handleVideoChange} hidden />
              </label>
            )}
          </div>
        </div>

        <div className="submit-section">
          <h3>文字描述（选填）</h3>
          <textarea
            rows={4}
            placeholder="描述现场情况，如排队人数、等待时间等..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="submit-section">
          <h3>位置信息</h3>
          <p className="location-info">当前位置：{lng.toFixed(6)}, {lat.toFixed(6)}</p>
          <p className="submit-hint">系统将验证您的位置是否在任务地点1000米范围内</p>
        </div>

        <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? '提交中...' : '提交结果'}
        </button>
      </div>
    </div>
  );
}
