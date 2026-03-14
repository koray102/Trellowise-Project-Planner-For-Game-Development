import { useStore } from '../store';
import { Link } from 'react-router-dom';
import { Users, ShieldAlert, KanbanSquare, Activity, CheckCircle2 } from 'lucide-react';

export function Dashboard() {
  const { users, currentUser, tasks, occupiedItems } = useStore();

  const myTasks = tasks.filter(t => t.assignedTo === currentUser?.id && t.status !== 'done');
  const myLocks = occupiedItems.filter(i => i.occupiedBy === currentUser?.id);
  
  const onlineCount = users.filter(u => u.status === 'online').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      
      {/* Welcome & Overview */}
      <div className="flex flex-col md:flex-row gap-6 md:items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            Welcome back, {currentUser?.name.split(' ')[0]} 👋
          </h1>
          <p className="text-zinc-400">Here's what's happening in GameDev Sync today.</p>
        </div>

        <div className="flex items-center gap-4 bg-zinc-900/80 p-4 rounded-xl border border-zinc-800/80 shadow-sm">
          <div className="flex -space-x-3">
            {users.map(user => (
              <div key={user.id} className="relative group">
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className="w-10 h-10 rounded-full bg-zinc-800 ring-2 ring-zinc-900 group-hover:z-10 relative transition-transform" 
                />
                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-zinc-900 z-20 ${
                  user.status === 'online' ? 'bg-emerald-500' :
                  user.status === 'away' ? 'bg-amber-500' : 'bg-zinc-500'
                }`} />
              </div>
            ))}
          </div>
          <div className="pl-4 border-l border-zinc-800">
            <div className="text-sm font-medium text-emerald-400">{onlineCount} Online</div>
            <div className="text-xs text-zinc-500">Team Status</div>
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        
        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-zinc-950/50 p-5 rounded-xl border border-zinc-800/60 flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-lg">
                <KanbanSquare className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{myTasks.length}</div>
                <div className="text-xs text-zinc-500 font-medium tracking-wide uppercase">Active Tasks</div>
              </div>
            </div>
            
            <div className="bg-zinc-950/50 p-5 rounded-xl border border-zinc-800/60 flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 text-amber-500 rounded-lg">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{myLocks.length}</div>
                <div className="text-xs text-zinc-500 font-medium tracking-wide uppercase">Locks Held</div>
              </div>
            </div>

            <div className="bg-zinc-950/50 p-5 rounded-xl border border-zinc-800/60 flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{tasks.filter(t=>t.status==='done').length}</div>
                <div className="text-xs text-zinc-500 font-medium tracking-wide uppercase">Total Done</div>
              </div>
            </div>
          </div>

          {/* My Tasks Panel */}
          <div className="bg-zinc-900/40 rounded-xl border border-zinc-800/80 overflow-hidden">
            <div className="border-b border-zinc-800/80 px-6 py-4 flex justify-between items-center bg-zinc-900/60">
              <h2 className="font-semibold text-zinc-100 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                My Active Tasks
              </h2>
              <Link to="/tasks" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">View Board &rarr;</Link>
            </div>
            <div className="p-2 space-y-1 bg-zinc-950/30">
              {myTasks.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-sm">You have no pending tasks.</div>
              ) : (
                myTasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between p-3 hover:bg-zinc-800/50 rounded-lg transition-colors border border-transparent hover:border-zinc-700/50 group">
                    <span className="text-sm text-zinc-300 font-medium">{task.title}</span>
                    <span className="text-xs font-semibold uppercase tracking-wider px-2 py-1 bg-zinc-800 rounded text-zinc-400 group-hover:bg-zinc-950">
                      {task.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Column (1/3) */}
        <div className="space-y-6">
          
          {/* Announcements/Feed */}
          <div className="bg-gradient-to-br from-indigo-500/10 to-transparent rounded-xl border border-indigo-500/20 overflow-hidden h-full min-h-[300px] flex flex-col">
            <div className="px-6 py-5 border-b border-indigo-500/10 bg-indigo-500/5">
              <h2 className="font-semibold text-indigo-400 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Team Announcements
              </h2>
            </div>
            <div className="p-6 flex-1 text-sm space-y-6">
              
              <div className="relative pl-4 border-l-2 border-indigo-500/40 pb-2">
                <div className="absolute w-2 h-2 rounded-full bg-indigo-500 -left-[5px] top-1.5 ring-4 ring-zinc-950" />
                <p className="text-zinc-200">New Unity Package added to repo.</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                  <img src={users[0].avatar} className="w-4 h-4 rounded-full" alt="" />
                  Alex • 2 hours ago
                </div>
              </div>

              <div className="relative pl-4 border-l-2 border-indigo-500/20 pb-2">
                <div className="absolute w-2 h-2 rounded-full bg-indigo-500/50 -left-[5px] top-1.5 ring-4 ring-zinc-950" />
                <p className="text-zinc-200">Main menu scene unlocked. Feel free to tweak UI.</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                  <img src={users[2].avatar} className="w-4 h-4 rounded-full" alt="" />
                  Jordan • Yesterday
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
