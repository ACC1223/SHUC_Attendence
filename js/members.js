
Vue.component('members-management', {
    props: ['persons', 'recentActivities', 'rollCallRecords'],
    template: `
        <div>
            <div class="section">
                <div class="section-title">
                    <span>成员出勤统计</span>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <div class="form-group" style="margin: 0; flex: 1;">
                            <input type="text" class="form-control" v-model="searchQuery" placeholder="搜索成员姓名或学号...">
                        </div>
                        <button class="btn" @click="showAddMemberModal = true">添加成员</button>
                    </div>
                </div>
                
                <div class="tab-container">
                    <div class="tab" :class="{ active: currentVoicePart === 'all' }" @click="currentVoicePart = 'all'">
                        全部
                    </div>
                    <div class="tab" v-for="voicePart in voiceParts" :key="voicePart.key"
                         :class="{ active: currentVoicePart === voicePart.key }"
                         @click="currentVoicePart = voicePart.key">
                        {{ voicePart.name }}
                    </div>
                </div>
                
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>学号</th>
                                <th>姓名</th>
                                <th>声部</th>
                                <th>团组</th>
                                <th>出勤</th>
                                <th>迟到</th>
                                <th>缺勤</th>
                                <th>请假</th>
                                <th>早退</th>
                                <th>备注</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
    <template v-for="(groups, voicePart) in groupedMembers" :key="voicePart">
        

        <!-- 团组分组 -->
        <template v-for="groupType in ['performance', 'preparatory']" :key="groupType">
            <tr v-if="groups[groupType].length">
                <td colspan="11" style="background: #fafafa; font-style: italic;">
                    {{ getGroupText(groupType) }}
                </td>

            </tr>

            <!-- 成员列表 -->
            <tr v-for="member in groups[groupType]" :key="member._id">
                <td>{{ member.studentId || '-' }}</td>
                <td>{{ member.name }}</td>
                <td>{{ getVoicePartText(member.voicePart) }}</td>
                <td>{{ getGroupText(member.group) }}</td>
                <td>{{ getMemberStats(member._id).present }}</td>
                <td>{{ getMemberStats(member._id).late }}</td>
                <td>{{ getMemberStats(member._id).absent }}</td>
                <td>{{ getMemberStats(member._id).leave }}</td>
                <td>{{ getMemberStats(member._id).early_leave }}</td>
                <td>
                    <input type="text" class="form-control" v-model="member.notes"
                           @change="updateMemberNotes(member)" placeholder="添加备注">
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit-btn" @click="editMember(member)">编辑</button>
                        <button class="action-btn detail-btn" @click="showMemberDetail(member)">详细</button>
                    </div>
                </td>
            </tr>
        </template>
    </template>

    <!-- 空状态 -->
    <tr v-if="Object.keys(groupedMembers).length === 0">
        <td colspan="11" style="text-align: center; padding: 20px; color: #666;">
            没有找到匹配的成员
        </td>
    </tr>
</tbody>

                    </table>
                </div>

                <div v-if="groupedMembers.length === 0" class="empty-state">
                    <div class="icon">🔍</div>
                    <div>没有找到匹配的成员</div>
                </div>
            </div>

            <!-- 添加/编辑成员模态框 -->
            <div class="modal-overlay" v-if="showAddMemberModal" @click="showAddMemberModal = false">
                <div class="modal-content" @click.stop>
                    <div class="modal-title">{{ editingMember ? '编辑成员' : '添加成员' }}</div>
                    <div class="form-group">
                        <label class="form-label">学号</label>
                        <input type="text" class="form-control" v-model="newMember.studentId" placeholder="输入学号">
                    </div>
                    <div class="form-group">
                        <label class="form-label">姓名</label>
                        <input type="text" class="form-control" v-model="newMember.name" placeholder="输入姓名">
                    </div>
                    <div class="form-group">
                        <label class="form-label">声部</label>
                        <select class="form-control" v-model="newMember.voicePart">
                            <option value="tenor">男高</option>
                            <option value="soprano">女高</option>
                            <option value="bass">男低</option>
                            <option value="alto">女低</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">团组</label>
                        <select class="form-control" v-model="newMember.group">
                            <option value="performance">表演团</option>
                            <option value="preparatory">预备团</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">电话</label>
                        <input type="text" class="form-control" v-model="newMember.phone" placeholder="输入电话">
                    </div>
                    <div class="form-group">
                        <label class="form-label">备注</label>
                        <input type="text" class="form-control" v-model="newMember.notes" placeholder="输入备注">
                    </div>
                    <div class="btn-group">
                        <button class="btn" @click="saveMember">{{ editingMember ? '更新' : '添加' }}</button>
                        <button class="btn" @click="cancelEdit">取消</button>
                    </div>
                </div>
            </div>

            <!-- 编辑成员模态框 -->
            <div class="modal-overlay" v-if="showEditMemberModal" @click="showEditMemberModal = false">
                <div class="modal-content" @click.stop>
                    <div class="modal-title">编辑成员</div>
                    <div class="form-group">
                        <label class="form-label">学号</label>
                        <input type="text" class="form-control" v-model="editingMember.studentId" placeholder="输入学号">
                    </div>
                    <div class="form-group">
                        <label class="form-label">姓名</label>
                        <input type="text" class="form-control" v-model="editingMember.name" placeholder="输入姓名">
                    </div>
                    <div class="form-group">
                        <label class="form-label">声部</label>
                        <select class="form-control" v-model="editingMember.voicePart">
                            <option value="tenor">男高</option>
                            <option value="soprano">女高</option>
                            <option value="bass">男低</option>
                            <option value="alto">女低</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">团组</label>
                        <select class="form-control" v-model="editingMember.group">
                            <option value="performance">表演团</option>
                            <option value="preparatory">预备团</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">电话</label>
                        <input type="text" class="form-control" v-model="editingMember.phone" placeholder="输入电话">
                    </div>
                    <div class="form-group">
                        <label class="form-label">备注</label>
                        <input type="text" class="form-control" v-model="editingMember.notes" placeholder="输入备注">
                    </div>
                    <div class="btn-group">
                        <button class="btn" @click="updateMember">更新</button>
                        <button class="btn btn-danger" @click="confirmDeleteMember(editingMember)">删除成员</button>
                        <button class="btn" @click="cancelEdit">取消</button>
                    </div>
                </div>
            </div>

            <!-- 确认删除模态框 -->
            <div class="modal-overlay" v-if="showConfirmDelete" @click="showConfirmDelete = false">
                <div class="modal-content" @click.stop>
                    <div class="modal-title">确认删除</div>
                    <div style="text-align: center; margin: 20px 0;">
                        {{ confirmDeleteMessage }}
                    </div>
                    <div class="btn-group">
                        <button class="btn btn-danger" @click="executeDelete">确认删除</button>
                        <button class="btn" @click="showConfirmDelete = false">取消</button>
                    </div>
                </div>
            </div>

            <!-- 成员详细出勤记录模态框 -->
<div class="modal-overlay" v-if="showMemberDetailModal" @click="showMemberDetailModal = false">
    <div class="modal-content wide-modal" @click.stop style="max-width: 800px; max-height: 90vh;">
        <div class="modal-title">{{ selectedMember ? selectedMember.name + ' - 详细出勤记录' : '详细出勤记录' }}</div>

        <!-- 数据状态提示 -->
        

        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>活动名称</th>
                        <th>日期</th>
                        <th>出勤状态</th>
                        <th>原因/备注</th>
                    </tr>
                </thead>
                <tbody>
                    
                    <tr v-for="record in sortedMemberRecords" :key="record.id">
                        <td>{{ getActivityName(record.activityId) }}</td>
                        <td>{{ formatDate(getActivityDate(record.activityId)) }}</td>
                        <td>{{ getStatusDisplayText(record.status) }}</td>
                        <td>{{ record.reason }}</td>
                        </tr>

                </tbody>
            </table>
        </div>
        <div class="btn-group" style="margin-top: 20px;">
            <button class="btn" @click="showMemberDetailModal = false">关闭</button>
        </div>
    </div>
</div>


    `,
    data() {
        return {
            currentVoicePart: 'all',
            searchQuery: '',
            showAddMemberModal: false,
            showEditMemberModal: false,
            showConfirmDelete: false,
            showMemberDetailModal: false,
            editingMember: null,
            selectedMember: null,
            itemToDelete: null,
            confirmDeleteMessage: '',
            newMember: {
                studentId: '',
                name: '',
                voicePart: 'tenor',
                group: 'performance',
                phone: '',
                notes: ''
            },
            voiceParts: [
                { key: 'tenor', name: '男高' },
                { key: 'soprano', name: '女高' },
                { key: 'bass', name: '男低' },
                { key: 'alto', name: '女低' }
            ]
        };
    },
    computed: {
        
            groupedMembers() {
                // 先按声部筛选
                let filtered = this.persons;
                if (this.currentVoicePart !== 'all') {
                    filtered = filtered.filter(m => m.voicePart === this.currentVoicePart);
                }
                if (this.searchQuery) {
                    const q = this.searchQuery.toLowerCase();
                    filtered = filtered.filter(m =>
                        m.name.toLowerCase().includes(q) ||
                        (m.studentId && m.studentId.toLowerCase().includes(q))
                    );
                }

                // 按声部 -> 团组分组
                const grouped = {};
                filtered.forEach(m => {
                    if (!grouped[m.voicePart]) grouped[m.voicePart] = { performance: [], preparatory: [] };
                    grouped[m.voicePart][m.group].push(m);
                });

                return grouped; // { tenor: { performance: [...], preparatory: [...] }, ... }
            },
        

        async loadRecentActivities() {
            const { data, error } = await supabaseRequest.select('activities', {
                order: { column: 'created_at', ascending: false },
                limit: 50
            });

            if (error) {
                console.error('加载活动失败:', error);
                this.recentActivities = [];
                return;
            }

            this.recentActivities = data.map(activity => ({
                _id: activity.id,
                name: activity.name,
                date: activity.date
            }));

            console.log('加载的活动数据:', this.recentActivities);  // 添加调试
        },
        sortedMemberRecords() {
            if (!this.selectedMember || !this.rollCallRecords || !this.recentActivities) {
                return [];
            }
            const memberId = this.selectedMember._id;
            // 兼容 userId 字段
            const records = this.rollCallRecords.filter(r =>
                String(r.userId) === String(memberId)
            );

            return records
                .map(r => ({
                    ...r,
                    reason: r.reason || '-',
                    status: r.status || 'unknown'
                }))
                .sort((a, b) => {
                    const dateA = this.getActivityDate(a.activityId);
                    const dateB = this.getActivityDate(b.activityId);
                    if (!dateA || !dateB) return 0;
                    return new Date(dateB) - new Date(dateA);
                });
        }

        





    },
    methods: {
        getStatusDisplayText(status) {
            const statusMap = {
                'present': '出勤',
                'late': '迟到',
                'absent': '缺勤',
                'leave': '请假',
                'early_leave': '早退',
                'not_required': '不用来',
                'not_frequent': '不经常来',
                'unknown': '未知'
            };
            return statusMap[status] || '未知';
        },
        getMemberStats(id) {
            const stats = { present: 0, late: 0, absent: 0, leave: 0, early_leave: 0 };
            this.rollCallRecords.forEach(r => {
                const memberId = r.userId || r.member_id || r.memberId;
                if (memberId === id) stats[r.status]++;
            });
            return stats;
        },
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
        getVoicePartText(v) {
            return { tenor: '男高', soprano: '女高', bass: '男低', alto: '女低' }[v] || '未知';
        },
        getGroupText(g) {
            return { performance: '表演团', preparatory: '预备团' }[g] || '未知';
        },
        
        getStatusText(person) {
            // 优先使用 rollCallRecords 查找当前活动的出勤记录
            const activityId = this.currentActivity?._id;
            if (!activityId || !person || !person._id) return '未记录';
            // 兼容 userId 字段类型
            const r = (this.rollCallRecords || []).find(rec =>
                (String(rec.activityId || rec.activity_id) === String(activityId)) &&
                (String(rec.userId || rec.member_id || rec.memberId) === String(person._id))
            );
            if (!r) return '未记录';
            const m = { 'present': '出勤', 'late': '迟到', 'absent': '缺勤', 'leave': '请假', 'early_leave': '早退', 'not_required': '不用来', 'not_frequent': '不经常来' };
            return m[r.status] || '未知';
        },
        findLocalRecord(activityId, userId) {
            return this.localRollcallRecords.find(r => r.activityId === activityId && r.userId === userId);
        },
        //补充上述函数的实现
        getActivityName(activityId) {
            const activity = this.recentActivities.find(a => a._id === activityId);
            return activity ? activity.name : '未知活动';
        },
        getActivityDate(activityId) {
            const activity = this.recentActivities.find(a => a._id === activityId);
            return activity ? activity.date : null;
        },

        

        formatDate(d) {
            if (!d) return '';
            try { return new Date(d).toLocaleDateString('zh-CN'); } catch { return d; }
        },
        editMember(m) {
            this.editingMember = { ...m };
            this.showEditMemberModal = true;
        },
        async updateMember() {
            if (!this.editingMember.name) return alert('请填写成员姓名');
            try {
                const { error } = await supabaseRequest.update('members', this.editingMember._id, {
                    student_id: this.editingMember.studentId,
                    name: this.editingMember.name,
                    voice_part: this.editingMember.voicePart,
                    group_type: this.editingMember.group,
                    phone: this.editingMember.phone,
                    notes: this.editingMember.notes
                });
                if (error) throw new Error(error.message);
                this.$emit('member-updated');
                alert('成员更新成功');
                this.showEditMemberModal = false;
                this.editingMember = null;
            } catch (e) { alert('更新失败: ' + e.message); }
        },
        async saveMember() {
            if (!this.newMember.name) return alert('请填写成员姓名');
            try {
                const { error } = await supabaseRequest.insert('members', {
                    student_id: this.newMember.studentId,
                    name: this.newMember.name,
                    voice_part: this.newMember.voicePart,
                    group_type: this.newMember.group,
                    phone: this.newMember.phone,
                    notes: this.newMember.notes
                });
                if (error) throw new Error(error.message);
                this.$emit('member-added');
                alert('成员添加成功');
                this.cancelEdit();
            } catch (e) { alert('添加失败: ' + e.message); }
        },
        cancelEdit() {
            this.showAddMemberModal = false;
            this.showEditMemberModal = false;
            this.editingMember = null;
            this.newMember = { studentId: '', name: '', voicePart: 'tenor', group: 'performance', phone: '', notes: '' };
        },
        async updateMemberNotes(m) {
            try {
                const { error } = await supabaseRequest.update('members', m._id, { notes: m.notes });
                if (error) throw new Error('更新失败');
                this.$emit('member-updated');
            } catch (e) { alert('更新备注失败: ' + e.message); }
        },
        showMemberDetail(member) {
            console.log('选中成员:', member);
            console.log('所有活动:', this.recentActivities);
            console.log('所有出勤记录:', this.rollCallRecords);
            this.selectedMember = member;           // 保存选中成员
            this.showMemberDetailModal = true;     // 控制 modal 显示
        }
,
        confirmDeleteMember(m) {
            this.itemToDelete = m;
            this.confirmDeleteMessage = `确定要删除成员 "${m.name}" 吗？此操作不可恢复！`;
            this.showConfirmDelete = true;
            this.showEditMemberModal = false;
        },
        async executeDelete() {
            try {
                const { error } = await supabaseRequest.delete('members', this.itemToDelete._id);
                if (error) throw new Error('删除失败');
                this.$emit('member-deleted');
                alert('成员删除成功');
            } catch (e) { alert('删除失败: ' + e.message); }
            finally {
                this.showConfirmDelete = false;
                this.itemToDelete = null;
                this.editingMember = null;
            }
        }
    },
    mounted() {
        this.localRollcallRecords = (this.rollCallRecords || []).map(r => ({ ...r }));
    }
});


