// 点名系统组件 - 修复版（使用固定顺序 currentOrder，避免跳人/闪烁）
Vue.component('attendance-system', {
    props: ['persons', 'recentActivities', 'rollCallRecords'],
    template: `
    <div>
      <!-- 活动选择/创建 -->
      <div class="section" v-if="!currentActivity">
        <div class="section-title">
          <span>选择或创建活动</span>
          <div style="display: flex; gap: 10px; align-items: center;">
            <div class="form-group" style="margin: 0; flex: 1;">
              <input type="text" class="form-control" v-model="searchActivityQuery" placeholder="搜索活动名称...">
            </div>
            <button class="btn" @click="showCreateActivity = true">创建活动</button>
          </div>
        </div>

        <div v-if="filteredActivities.length > 0">
          <div v-for="activity in filteredActivities" :key="activity._id" class="activity-card">
            <div @click="selectActivity(activity)" style="flex: 1; cursor: pointer;">
              <div class="activity-name">{{ activity.name }}</div>
              <div class="activity-date">{{ formatDate(activity.date) }}</div>
            </div>
            <div class="action-buttons">
              <button class="action-btn edit-btn" @click.stop="editActivity(activity)">编辑</button>
              <button class="btn btn-danger" @click.stop="confirmDeleteActivity(activity)">删除</button>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <div class="icon">📅</div>
          <div>暂无活动</div>
        </div>
      </div>

      <!-- 声部选择界面 -->
      <div v-if="currentActivity && !currentVoicePart">
        <div class="section">
          <div class="section-title">
            <span>选择声部开始点名 - {{ currentActivity.name }}</span>
            <button class="btn" @click="backToActivitySelect">返回活动选择</button>
          </div>

          <div class="btn-group" style="grid-template-columns: 1fr;">
            <button class="btn-status"
                    v-for="voicePart in voiceParts"
                    :key="voicePart.key"
                    @click="startVoicePartRollCall(voicePart.key)"
                    :style="{ background: getVoicePartColor(voicePart.key) }">
              {{ voicePart.name }} ({{ getVoicePartRemainingCount(voicePart.key) }}人未点)
            </button>
          </div>
        </div>

        <!-- 声部统计表格 -->
        <div class="section">
          <div class="section-title">活动统计 - {{ currentActivity.name }}</div>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>统计项</th>
                  <th v-for="voicePart in voiceParts" :key="voicePart.key">{{ voicePart.name }}</th>
                  <th>总计</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="stat in statsItems" :key="stat.key">
                  <td>{{ stat.name }}</td>
                  <td v-for="voicePart in voiceParts" :key="voicePart.key">{{ getVoicePartStat(voicePart.key, stat.key) }}</td>
                  <td><strong>{{ getTotalStat(stat.key) }}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 声部点名界面 -->
      <div v-if="currentActivity && currentVoicePart">
        <div class="section">
          <div class="section-title">
            <span>{{ getCurrentVoicePartName() }}点名 - {{ currentActivity.name }}</span>
            <button class="btn" @click="backToVoicePartSelect">返回声部选择</button>
          </div>

          <div class="voice-part-section" v-if="currentVoicePartRemainingCount > 0">
            <div class="person-card active-person">
              <div class="person-info">
                <div class="person-name">{{ currentPerson ? currentPerson.name : '' }}</div>
                <div class="person-details">
                  {{ currentPerson ? getGroupText(currentPerson.group) : '' }}
                  <div class="form-group reason-input" style="margin-top: 10px;">
                    <label class="form-label">原因说明（可选）</label>
                    <input type="text" class="form-control" v-model="currentReason" placeholder="填写原因...">
                  </div>
                </div>
              </div>
            </div>

            <div class="btn-group">
              <button class="btn-status btn-present" @click="recordStatus('present')">出勤</button>
              <button class="btn-status btn-late" @click="recordStatus('late')">迟到</button>
              <button class="btn-status btn-absent" @click="recordStatus('absent')">缺勤</button>
              <button class="btn-status btn-leave" @click="recordStatus('leave')">请假</button>
              <button class="btn-status btn-early_leave" @click="recordStatus('early_leave')">早退</button>
              <button class="btn-status btn-not_required" @click="recordStatus('not_required')">不用来，比如周三的预备团</button>
              <button class="btn-status btn-not_frequent" @click="recordStatus('not_frequent')">不经常来，故无须专门请假</button>
              

            </div>
          </div>

          <div v-else class="empty-state">
            <div class="icon">✅</div>
            <div>该声部点名已完成</div>
            <button class="btn" @click="backToVoicePartSelect" style="margin-top: 10px;">返回声部选择</button>
          </div>
        </div>

        <!-- 当前声部进度 -->
        <div class="section">
          <div class="section-title">{{ getCurrentVoicePartName() }}点名进度</div>
          <div class="progress-info">
            <span>已完成: {{ currentVoicePartRecordedCount }} / {{ currentVoicePartTotalCount }}</span>
            <span>{{ currentVoicePartProgressPercent }}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-inner" :style="{ width: currentVoicePartProgressPercent + '%' }"></div>
          </div>

          <!-- 当前声部统计 -->
          <div class="stats-container" style="margin-top: 15px;">
            <div class="stat-item"><div class="stat-value">{{ currentVoicePartStats.present }}</div><div class="stat-label">出勤</div></div>
            <div class="stat-item"><div class="stat-value">{{ currentVoicePartStats.late }}</div><div class="stat-label">迟到</div></div>
            <div class="stat-item"><div class="stat-value">{{ currentVoicePartStats.absent }}</div><div class="stat-label">缺勤</div></div>
            <div class="stat-item"><div class="stat-value">{{ currentVoicePartStats.leave }}</div><div class="stat-label">请假</div></div>
            <div class="stat-item"><div class="stat-value">{{ currentVoicePartStats.early_leave }}</div><div class="stat-label">早退</div></div>
            <div class="stat-item" style="grid-column: span 2; background: #e8f4e8;"><div class="stat-value">{{ currentVoicePartStats.actual }}</div><div class="stat-label">实到人数</div></div>
          </div>

          <!-- 成员列表，可点击修改状态 -->
          <div v-for="person in currentVoicePartAllPersons" :key="person._id" class="person-card" :class="{ 'active-person': currentPerson && person._id === currentPerson._id }">
            <div class="person-info">
              <div class="person-name">{{ person.name }}</div>
              <div class="person-details">
                {{ getGroupText(person.group) }}
                <span v-if="getReasonText(person)" class="reason-text">({{ getReasonText(person) }})</span>
              </div>
            </div>
            <div class="person-status" :class="getStatusClass(person)" @click="openEditStatus(person)">
              {{ getStatusText(person) }}
            </div>
          </div>
        </div>
      </div>

      <!-- 点名完成界面 -->
      <div v-if="currentActivity && isAllVoicePartsComplete">
        <div class="section">
          <div class="section-title">点名完成 - {{ currentActivity.name }}</div>
          <div class="stats-container">
            <div class="stat-item"><div class="stat-value">{{ stats.present }}</div><div class="stat-label">出勤</div></div>
            <div class="stat-item"><div class="stat-value">{{ stats.late }}</div><div class="stat-label">迟到</div></div>
            <div class="stat-item"><div class="stat-value">{{ stats.absent }}</div><div class="stat-label">缺勤</div></div>
            <div class="stat-item"><div class="stat-value">{{ stats.leave }}</div><div class="stat-label">请假</div></div>
            <div class="stat-item"><div class="stat-value">{{ stats.early_leave }}</div><div class="stat-label">早退</div></div>
            <div class="stat-item" style="grid-column: span 2; background: #e8f4e8;"><div class="stat-value">{{ stats.actual }}</div><div class="stat-label">实到人数</div></div>
          </div>
        </div>

        <div class="btn-group">
          <button class="btn" @click="exportData">导出数据</button>
          <button class="btn" @click="backToActivitySelect">返回首页</button>
        </div>
      </div>

      <!-- 创建/编辑活动模态框 -->
      <div class="modal-overlay" v-if="showCreateActivity || showEditActivity" @click="closeActivityModal">
        <div class="modal-content" @click.stop>
          <div class="modal-title">{{ editingActivity ? '编辑活动' : '创建活动' }}</div>
          <div class="form-group">
            <label class="form-label">活动名称</label>
            <input type="text" class="form-control" v-model="activityForm.name" placeholder="输入活动名称">
          </div>
          <div class="form-group">
            <label class="form-label">活动日期</label>
            <input type="date" class="form-control" v-model="activityForm.date">
          </div>
          <div class="btn-group">
            <button class="btn" @click="saveActivity">{{ editingActivity ? '更新' : '创建' }}</button>
            <button class="btn" @click="closeActivityModal">取消</button>
          </div>
        </div>
      </div>

      <!-- 编辑状态模态框 -->
      <div class="modal-overlay" v-if="showEditStatusModal" @click="showEditStatusModal = false">
        <div class="modal-content" @click.stop>
          <div class="modal-title">修改状态 - {{ editingPerson ? editingPerson.name : '' }}</div>

          <div class="btn-group" style="grid-template-columns: 1fr; margin-bottom: 15px;">
            <button class="btn-status"
                    v-for="status in statusOptions"
                    :key="status.key"
                    :class="[getStatusButtonClass(status.key), { 'active-status': selectedStatus === status.key }]"
                    @click="selectedStatus = status.key">
              {{ status.name }}
            </button>
          </div>

          <div class="form-group">
            <label class="form-label">原因说明（可选）</label>
            <input type="text" class="form-control" v-model="editingReason" placeholder="填写原因...">
          </div>

          <div class="btn-group">
            <button class="btn" @click="submitStatusUpdate" :disabled="!selectedStatus">提交</button>
            <button class="btn" @click="cancelStatusEdit">取消</button>
          </div>
        </div>
      </div>

      <!-- 确认删除模态框 -->
      <div class="modal-overlay" v-if="showConfirmDelete" @click="showConfirmDelete = false">
        <div class="modal-content" @click.stop>
          <div class="modal-title">确认删除</div>
          <div style="text-align: center; margin: 20px 0;">{{ confirmDeleteMessage }}</div>
          <div class="btn-group">
            <button class="btn btn-danger" @click="executeDelete">确认删除</button>
            <button class="btn" @click="showConfirmDelete = false">取消</button>
          </div>
        </div>
      </div>
    </div>
  `,
    data() {
        return {
            currentActivity: null,
            currentVoicePart: null,
            showCreateActivity: false,
            showEditActivity: false,
            showEditStatusModal: false,
            showConfirmDelete: false,
            searchActivityQuery: '',
            currentReason: '',
            editingActivity: null,
            editingPerson: null,
            activityForm: { name: '', date: '' },
            selectedStatus: null,
            editingReason: '',
            itemToDelete: null,
            confirmDeleteMessage: '',
            voiceParts: [
                { key: 'tenor', name: '男高' },
                { key: 'soprano', name: '女高' },
                { key: 'bass', name: '男低' },
                { key: 'alto', name: '女低' }
            ],
            statsItems: [
                { key: 'present', name: '出勤' },
                { key: 'late', name: '迟到' },
                { key: 'leave', name: '请假' },
                { key: 'absent', name: '缺勤' },
                { key: 'early_leave', name: '早退' },
                { key: 'actual', name: '实到人数' }
            ],
            statusOptions: [
                { key: 'present', name: '出勤' },
                { key: 'late', name: '迟到' },
                { key: 'absent', name: '缺勤' },
                { key: 'leave', name: '请假' },
                { key: 'early_leave', name: '早退' },
                { key: 'not_required', name: '不用来' },
                { key: 'not_frequent', name: '不经常来' }
            ],
            currentPersonIndex: 0,
            // 固定的当前声部点名顺序（只在开始某声部时设定）
            currentOrder: [],

            // 本地维护的点名记录副本，用于即时 UI 更新
            localRollcallRecords: []
        };
    },
    computed: {
        sortedActivities() {
            console.log('所有活动:', this.recentActivities);
            return [...(this.recentActivities || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
        },
        filteredActivities() {
            if (!this.searchActivityQuery) return this.sortedActivities;
            const q = this.searchActivityQuery.toLowerCase();
            return this.sortedActivities.filter(a => (a.name || '').toLowerCase().includes(q));
        },
        sortedPersons() {
            const groupOrder = { 'performance': 0, 'preparatory': 1 };
            const voiceOrder = { 'tenor': 0, 'soprano': 1, 'bass': 2, 'alto': 3 };
            return (this.persons || []).slice().sort((a, b) => (groupOrder[a.group] - groupOrder[b.group]) || (voiceOrder[a.voicePart] - voiceOrder[b.voicePart]));
        },
        currentVoicePartAllPersons() {
            return this.sortedPersons.filter(p => p.voicePart === this.currentVoicePart);
        },
        currentVoicePartRemainingPersons() {
            return this.currentVoicePartAllPersons.filter(p => !this.isPersonRecorded(p));
        },
        // currentPerson 改为基于 currentOrder + currentPersonIndex，避免 computed 过滤导致抖动
        currentPerson() {
            if (!this.currentOrder || this.currentOrder.length === 0) return null;
            // 防越界
            if (this.currentPersonIndex >= this.currentOrder.length) this.currentPersonIndex = 0;
            // 从 currentPersonIndex 往后找第一个未记录的人
            for (let i = 0; i < this.currentOrder.length; i++) {
                const idx = (this.currentPersonIndex + i) % this.currentOrder.length;
                const pid = this.currentOrder[idx];
                const person = this.currentVoicePartAllPersons.find(p => p._id === pid);
                if (person && !this.isPersonRecorded(person)) {
                    // 把 currentPersonIndex 指向这个位置并返回 person
                    this.currentPersonIndex = idx;
                    return person;
                }
            }
            // 全部已记录
            return null;
        },
        currentVoicePartRemainingCount() { return this.currentVoicePartRemainingPersons.length; },
        currentVoicePartRecordedCount() { return this.currentVoicePartAllPersons.filter(p => this.isPersonRecorded(p)).length; },
        currentVoicePartTotalCount() { return this.currentVoicePartAllPersons.length; },
        currentVoicePartProgressPercent() {
            if (this.currentVoicePartTotalCount === 0) return 0;
            return Math.round((this.currentVoicePartRecordedCount / this.currentVoicePartTotalCount) * 100);
        },
        currentVoicePartStats() {
            const stats = { present: 0, late: 0, absent: 0, leave: 0, early_leave: 0, actual: 0 };
            this.currentVoicePartAllPersons.forEach(p => {
                const r = this.findLocalRecord(this.currentActivity?._id, p._id);
                if (r) {
                    stats[r.status] = (stats[r.status] || 0) + 1;
                    if (['present', 'late', 'early_leave'].includes(r.status)) stats.actual++;
                }
            });
            return stats;
        },
        isAllVoicePartsComplete() {
            return this.voiceParts.every(vp => {
                return this.sortedPersons.filter(p => p.voicePart === vp.key).filter(p => !this.isPersonRecorded(p)).length === 0;
            });
        },
        stats() {
            const s = { present: 0, late: 0, absent: 0, leave: 0, early_leave: 0, actual: 0 };
            this.localRollcallRecords.forEach(r => {
                if (r.activityId === this.currentActivity?._id) {
                    s[r.status] = (s[r.status] || 0) + 1;
                    if (['present', 'late', 'early_leave'].includes(r.status)) s.actual++;
                }
            });
            return s;
        }
    },
    watch: {
        rollCallRecords: {
            handler(newVal) {
                // 保持副本（父组件更新时同步）
                this.localRollcallRecords = (newVal || []).map(r => ({ ...r }));
            },
            immediate: true
        }
    },
    methods: {
        findLocalRecord(activityId, userId) {
            return this.localRollcallRecords.find(r => r.activityId === activityId && r.userId === userId);
        },

        selectActivity(activity) {
            this.currentActivity = activity;
            this.currentVoicePart = null;
            this.currentPersonIndex = 0;
            this.currentReason = '';
            // 清掉旧的顺序
            this.currentOrder = [];
            this.loadRollcallRecords();
            this.$emit('activity-selected', activity);
        },

        // 新增：当开始某个声部时，固定点名顺序
        startVoicePartRollCall(vp) {
            this.currentVoicePart = vp;
            // 构建固定顺序（按 currentVoicePartAllPersons 当前顺序）
            this.currentOrder = this.currentVoicePartAllPersons.map(p => p._id);
            this.currentPersonIndex = 0;
            this.currentReason = '';
        },

        backToVoicePartSelect() {
            this.currentVoicePart = null;
            this.currentPersonIndex = 0;
            this.currentReason = '';
            this.currentOrder = []; // 清顺序
        },

        backToActivitySelect() {
            this.currentActivity = null;
            this.currentVoicePart = null;
            this.currentPersonIndex = 0;
            this.currentReason = '';
            this.currentOrder = [];
        },

        // 计算声部剩余人数（仍用 isPersonRecorded 保证统计正确）
        getVoicePartRemainingCount(vpKey) {
            return this.sortedPersons.filter(p => p.voicePart === vpKey).filter(p => !this.isPersonRecorded(p)).length;
        },

        getVoicePartStat(voicePartKey, statKey) {
            let count = 0;
            this.sortedPersons.filter(p => p.voicePart === voicePartKey).forEach(p => {
                const r = this.findLocalRecord(this.currentActivity?._id, p._id);
                if (r) {
                    if (statKey === 'actual') {
                        if (['present', 'late', 'early_leave'].includes(r.status)) count++;
                    } else if (r.status === statKey) count++;
                }
            });
            return count;
        },

        getTotalStat(statKey) { return this.voiceParts.reduce((sum, vp) => sum + this.getVoicePartStat(vp.key, statKey), 0); },
        getStatusButtonClass(status) { return 'btn-' + status; },
        getCurrentVoicePartName() { const vp = this.voiceParts.find(v => v.key === this.currentVoicePart); return vp ? vp.name : ''; },
        getVoicePartColor(key) { const c = { 'tenor': '#1aad19', 'soprano': '#f0ad4e', 'bass': '#5bc0de', 'alto': '#ff8c00' }; return c[key] || '#1aad19'; },
        isPersonRecorded(person) { return !!this.findLocalRecord(this.currentActivity?._id, person._id); },
        getGroupText(group) { const m = { 'performance': '表演团', 'preparatory': '预备团' }; return m[group] || '未知'; },
        getStatusText(person) {
            const r = this.findLocalRecord(this.currentActivity?._id, person._id);
            if (!r) return '未记录';
            const m = { 'present': '出勤', 'late': '迟到', 'absent': '缺勤', 'leave': '请假', 'early_leave': '早退', 'not_required': '不用来' ,'not_frequent':'不经常来'};
            return m[r.status] || '未知';
        },
        getReasonText(person) { const r = this.findLocalRecord(this.currentActivity?._id, person._id); return r && r.reason ? r.reason : ''; },
        getStatusClass(person) { const r = this.findLocalRecord(this.currentActivity?._id, person._id); return r ? `status-${r.status}` : 'status-none'; },

        editActivity(activity) { this.editingActivity = activity; this.activityForm = { name: activity.name, date: activity.date }; this.showEditActivity = true; },

        // advancePointer：把指针前移到下一个未记录的人（如果没有则重置）
        advancePointer() {
            if (!this.currentOrder || this.currentOrder.length === 0) return;
            const len = this.currentOrder.length;
            let next = (this.currentPersonIndex + 1) % len;
            for (let i = 0; i < len; i++) {
                const idx = (next + i) % len;
                const pid = this.currentOrder[idx];
                const person = this.currentVoicePartAllPersons.find(p => p._id === pid);
                if (person && !this.isPersonRecorded(person)) {
                    this.currentPersonIndex = idx;
                    return;
                }
            }
            // 全部已记录
            this.currentPersonIndex = 0;
        },

        // recordStatus：记录并立即跳到下一个（类似 i++）
        async recordStatus(status) {
            if (!this.currentActivity || !this.currentPerson) return;

            const currentId = this.currentPerson._id;

            try {
                // 查找本地记录
                let existing = this.findLocalRecord(this.currentActivity._id, currentId);

                if (existing) {
                    // 更新本地并异步更新服务器
                    existing.status = status;
                    existing.reason = this.currentReason;

                    // 等待服务器返回
                    const res = await supabaseRequest.update('rollcall_records', existing.id, {
                        status: status,
                        reason: this.currentReason,
                        record_time: new Date().toISOString()
                    });
                    if (res.error) throw new Error(res.error.message || '更新失败');
                } else {
                    // 新建记录
                    const { data, error } = await supabaseRequest.insert('rollcall_records', {
                        activity_id: this.currentActivity._id,
                        member_id: currentId,
                        status: status,
                        reason: this.currentReason
                    });
                    if (error) throw new Error(error.message || '插入失败');

                    // 写回本地副本
                    const row = data[0];
                    this.localRollcallRecords.push({
                        id: row.id || row._id,
                        activityId: row.activity_id,
                        userId: row.member_id,
                        status: row.status,
                        reason: row.reason,
                        timestamp: new Date(row.record_time || Date.now())
                    });
                }

                // 数据成功写入后再切换到下一个人
                const remaining = this.currentVoicePartAllPersons.filter(p => !this.isPersonRecorded(p));
                const nextIndex = remaining.findIndex(p => p._id === currentId) + 1;
                this.currentPersonIndex = nextIndex < remaining.length ? nextIndex : 0;

                this.currentReason = '';

                // 通知父组件
                this.$emit('record-updated', this.localRollcallRecords.map(r => ({
                    id: r.id, activityId: r.activityId, userId: r.userId, status: r.status, reason: r.reason, timestamp: r.timestamp
                })));

            } catch (e) {
                alert('记录失败: ' + (e.message || e));
                console.error(e);
            }
        },



        skipCurrentPerson() {
            if (!this.currentPerson) return;
            this.currentReason = '';
            // 直接 advancePointer（跳过当前，不写后端）
            this.advancePointer();
        },

        // loadRollcallRecords: 从服务器读取并写入 localRollcallRecords
        async loadRollcallRecords() {
         
            if (!this.currentActivity) return;
            try {
                const { data, error } = await supabaseRequest.select('rollcall_records', {
                    where: { column: 'activity_id', value: this.currentActivity._id }

                });
                if (error) { console.error('加载记录失败', error); return; }
                this.localRollcallRecords = (data || []).map(r => ({
                    id: r.id || r._id,
                    activityId: r.activity_id,
                    userId: r.member_id,
                    status: r.status,
                    reason: r.reason,
                    timestamp: r.record_time ? new Date(r.record_time) : new Date()
                }));
                this.$emit('record-updated', this.localRollcallRecords.map(r => ({ id: r.id, activityId: r.activityId, userId: r.userId, status: r.status, reason: r.reason, timestamp: r.timestamp })));
            } catch (e) {
                console.error('loadRollcallRecords error', e);
            }
        },

        // 编辑状态模态框相关（保持你之前逻辑）
        openEditStatus(person) {
            const r = this.findLocalRecord(this.currentActivity._id, person._id);
            this.editingPerson = person;
            this.selectedStatus = r ? r.status : null;
            this.editingReason = r ? r.reason : '';
            this.showEditStatusModal = true;
        },

        async submitStatusUpdate() {
            if (!this.selectedStatus) { alert('请选择状态'); return; }
            try {
                const memberId = this.editingPerson._id;
                let existing = this.findLocalRecord(this.currentActivity._id, memberId);

                if (existing) {
                    existing.status = this.selectedStatus;
                    existing.reason = this.editingReason;
                    const idx = this.localRollcallRecords.findIndex(r => r.activityId === existing.activityId && r.userId === existing.userId);
                    if (idx !== -1) this.$set(this.localRollcallRecords, idx, { ...existing });

                    supabaseRequest.update('rollcall_records', existing.id, {
                        status: existing.status,
                        reason: existing.reason,
                        record_time: new Date().toISOString()
                    }).then(res => { if (res && res.error) console.error(res.error); }).catch(err => console.error(err));
                } else {
                    const { data, error } = await supabaseRequest.insert('rollcall_records', {
                        activity_id: this.currentActivity._id,
                        member_id: memberId,
                        status: this.selectedStatus,
                        reason: this.editingReason
                    });
                    if (error) throw new Error(error.message || '新增记录失败');
                    const row = (data && data[0]) || {};
                    existing = {
                        id: row.id || row._id || ('new-' + Math.random().toString(36).slice(2)),
                        activityId: row.activity_id || this.currentActivity._id,
                        userId: row.member_id || memberId,
                        status: row.status || this.selectedStatus,
                        reason: row.reason || this.editingReason,
                        timestamp: new Date(row.record_time || Date.now())
                    };
                    this.localRollcallRecords.push(existing);
                }

                await this.loadRollcallRecords();
                this.showEditStatusModal = false;
                this.selectedStatus = null;
                this.editingReason = '';
                this.editingPerson = null;
                
            } catch (e) {
                alert('更新失败: ' + (e.message || e));
                console.error(e);
            }
        },

        cancelStatusEdit() { this.showEditStatusModal = false; this.selectedStatus = null; this.editingReason = ''; this.editingPerson = null; },

        confirmDeleteActivity(activity) { this.itemToDelete = activity; this.confirmDeleteMessage = `确定要删除活动 "${activity.name}" 吗？此操作不可恢复！`; this.showConfirmDelete = true; },

        async saveActivity() {
            // 保持你已有实现或替换为后端调用（这里只是占位）
            if (!this.activityForm.name || !this.activityForm.date) { alert('请填写活动名称和日期'); return; }
            try {
                if (this.showEditActivity && this.editingActivity) {
                    const { error } = await supabaseRequest.update('activities', this.editingActivity._id, {
                        name: this.activityForm.name,
                        date: this.activityForm.date
                    });
                    if (error) throw new Error(error.message || '更新失败');
                    const idx = this.recentActivities.findIndex(a => a._id === this.editingActivity._id);
                    if (idx !== -1) {
                        this.$set(this.recentActivities, idx, { ...this.recentActivities[idx], name: this.activityForm.name, date: this.activityForm.date });
                    }
                    alert('活动更新成功');
                    this.$emit('activity-updated');
                } else {
                    const { data, error } = await supabaseRequest.insert('activities', { name: this.activityForm.name, date: this.activityForm.date, type: 'rehearsal' });
                    if (error) throw new Error(error.message || '创建失败');
                    alert('活动创建成功');
                    this.$emit('activity-created');
                }
                this.closeActivityModal();
            } catch (e) {
                alert('保存失败: ' + (e.message || e));
                console.error('saveActivity error', e);
            }
        },

        async executeDelete() {
            if (!this.itemToDelete) return;
            try {
                const { error } = await supabaseRequest.delete('activities', this.itemToDelete._id);
                if (error) throw new Error(error.message || '删除失败');
                this.showConfirmDelete = false;
                this.itemToDelete = null;
                alert('活动删除成功');
                this.$emit('activity-deleted');
            } catch (e) {
                alert('删除失败: ' + (e.message || e));
                console.error('executeDelete error', e);
            }
        },

        closeActivityModal() {
            this.showCreateActivity = false;
            this.showEditActivity = false;
            this.editingActivity = null;
            this.activityForm = { name: '', date: '' };
        },

        exportData() {
            if (!this.currentActivity) return;
            const data = {
                activity: this.currentActivity,
                records: this.localRollcallRecords.filter(r => r.activityId === this.currentActivity._id),
                stats: this.stats,
                timestamp: new Date().toISOString()
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `点名记录_${this.currentActivity.name}_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        },

        formatDate(dateStr) { if (!dateStr) return ''; const d = new Date(dateStr); return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日'; }
    },
    mounted() {
        this.localRollcallRecords = (this.rollCallRecords || []).map(r => ({ ...r }));
    }
});
