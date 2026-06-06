import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import MainLayout from './components/Layout/MainLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import PublishTask from './pages/PublishTask';
import TaskDetail from './pages/TaskDetail';
import SubmitTask from './pages/SubmitTask';
import BrowseTasks from './pages/BrowseTasks';
import MyTasks from './pages/MyTasks';
import Profile from './pages/Profile';
import Wallet from './pages/Wallet';
import Reviews from './pages/Reviews';
import Messages from './pages/Messages';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
          <Route index element={<Home />} />
          <Route path="browse" element={<BrowseTasks />} />
          <Route path="messages" element={<Messages />} />
          <Route path="publish" element={<PublishTask />} />
          <Route path="my-tasks" element={<MyTasks />} />
          <Route path="my-tasks/accepted" element={<MyTasks />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/wallet" element={<Wallet />} />
          <Route path="profile/reviews" element={<Reviews />} />
          <Route path="task/:id" element={<TaskDetail />} />
          <Route path="task/:id/submit" element={<SubmitTask />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
