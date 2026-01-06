// 主应用逻辑
new Vue({
    el: '#app',
    data: {
        // 页面状态
        currentPage: 'attendance',
        loading: false,
        error: '',
        
        // 数据
        persons: [],
        recentActivities: [],
        rollCallRecords: [],
        clothingRecords: []
    },
    methods: {
        // 切换页面
        switchPage(page) {
            this.currentPage = page;
        },

        // 初始化数据
        async initData() {
            this.loading = true;
            this.error = '';
            try {
                await this.loadMembers();
                await this.loadRecentActivities();
                await this.loadRollcallRecords();
                await this.loadClothingRecords();
            } catch (error) {
                this.error = '数据加载失败: ' + (error.message || '未知错误');
            } finally {
                this.loading = false;
            }
        },
        selectActivity(activity) {
            console.log('已选择活动：', activity);
            // 如果你希望在点名界面切换活动，可以在这里更新全局状态
            // 比如 this.currentActivity = activity;
        },

        // 防止删除活动时报错
        async executeDelete(activity) {
            if (!confirm(`确认删除活动 "${activity.name}" 吗？`)) return;
            const { error } = await supabaseRequest.remove('activities', activity._id);
            if (error) {
                alert('删除失败：' + error.message);
                return;
            }
            // 从前端 recentActivities 列表里删除对应项
            this.recentActivities = this.recentActivities.filter(a => a._id !== activity._id);
            alert('已删除活动');
        },

        // 防止编辑活动时报错
        async saveActivity(updatedActivity) {
            const { error } = await supabaseRequest.update('activities', updatedActivity._id, {
                name: updatedActivity.name,
                date: updatedActivity.date
            });
            if (error) {
                alert('保存失败：' + error.message);
                return;
            }
            const idx = this.recentActivities.findIndex(a => a._id === updatedActivity._id);
            if (idx !== -1) this.$set(this.recentActivities, idx, updatedActivity);
            alert('活动已更新');
        },
        // 加载成员数据
        async loadMembers() {
    const { data, error } = await supabaseRequest.select('members', {
        order: { column: 'voice_part', ascending: true }
    });
    
    if (error) {
        console.error('加载成员失败:', error);
        // 使用模拟数据
        this.persons = this.getMockMembers();
        return;
    }
    
    // 正确映射：数据库的 student_id -> 前端的 studentId
    this.persons = data.map(member => ({
        _id: member.id,
        studentId: member.student_id || '', // 这里映射！
        name: member.name,
        voicePart: member.voice_part,
        group: member.group_type,
        phone: member.phone || '',
        notes: member.notes || ''
    }));
},

        // 加载最近活动
        async loadRecentActivities() {
            const { data, error } = await supabaseRequest.select('activities', {
                order: { column: 'created_at', ascending: false },
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
        },

        // 加载点名记录
        async loadRollcallRecords() {
            const { data, error } = await supabaseRequest.select('rollcall_records');
            
            if (error) {
                console.error('加载记录失败:', error);
                return;
            }
            
            this.rollCallRecords = data.map(record => ({
                id: record.id,
                activityId: record.activity_id,
                userId: record.member_id,
                status: record.status,
                reason: record.reason,
                timestamp: new Date(record.record_time)
            }));
        },

        // 加载服装记录
        async loadClothingRecords() {
            const { data, error } = await supabaseRequest.select('clothing_records', {
                order: { column: 'created_at', ascending: false }
            });

            if (error) {
                console.error('加载服装记录失败:', error);
                this.clothingRecords = [];
                return;
            }

            this.clothingRecords = data.map(record => ({
                id: record.id,
                memberId: record.member_id,
                memberName: record.member_name,
                gender: record.gender,
                suit: record.suit,
                shirt: record.shirt,
                dress: record.dress,
                suitableSize: record.suitable_size,
                isBorrowed: record.is_borrowed,
                borrowedSize: record.borrowed_size,
                notes: record.notes || ''
            }));
        }
    },
    mounted() {
        this.initData();
    }
});
