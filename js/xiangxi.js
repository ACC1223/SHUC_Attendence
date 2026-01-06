//根据我的app.js，设计一个页面，点击每个人的名字能看到每次活动的名称和这个人的出勤情况和原因
//             });
//             if (error) {
//                 alert('保存失败：' + error.message);
//                 return;
//             }
//             // 更新前端 recentActivities 列表
//             const index = this.recentActivities.findIndex(a => a._id === updatedActivity._id);
//             if (index !== -1) {
//                 this.$set(this.recentActivities, index, updatedActivity);
//             }
//             alert('已保存活动');
//         },
//
//         // 加载成员列表
//         async loadMembers() {
//             const { data, error } = await supabaseRequest.select('persons');
//             if (error) {
//                 console.error('加载成员失败:', error);
//                 // 使用模拟数据
//                 this.persons = this.getMockMembers();
//             } else {
//                 this.persons = data;
//             }
//         },
//         getMockMembers() {
//             return [
//                 { _id: 1, name: '张三', voice_part: '高音' },
//                 { _id: 2, name: '李四', voice_part: '中音' },
//                 { _id: 3, name: '王五', voice_part: '低音' },
//             ];
//         },
//         async loadAttendanceRecords() {
//             const { data, error } = await supabaseRequest.select('attendance_records');
//             if (error) {
//                 console.error('加载出勤记录失败:', error);
//                 this.attendanceRecords = [];
//             } else {
//                 this.attendanceRecords = data;
//             }
//         },
//         async showAttendanceDetails(person) {
//             this.selectedPerson = person;
//             const { data, error } = await supabaseRequest.select('attendance_records', {
//                 filter: { person_id: person._id }
//             });
//             if (error) {
//                 console.error('加载出勤详情失败:', error);
//                 this.attendanceDetails = [];
//             } else {
//                 this.attendanceDetails = data;
//             }
//             this.showAttendanceModal = true;
//         },
//         async loadAttendanceRecords() {
//             const { data, error } = await supabaseRequest.select('attendance_records');
//             if (error) {
//                 console.error('加载出勤记录失败:', error);
//                 this.attendanceRecords = [];
//             } else {
//                 this.attendanceRecords = data;
//             }
//         },
//         async showAttendanceDetails(person) {
//             this.selectedPerson = person;
//             const { data, error } = await supabaseRequest.select('attendance_records', {
//                 filter: { person_id: person._id }
//             });
//             if (error) {
//                 console.error('加载出勤详情失败:', error);
//                 this.attendanceDetails = [];
//             } else {
//                 this.attendanceDetails = data;
//             }
//             this.showAttendanceModal = true;
//         },
//         getMockMembers() {
//             return [
//                 { _id: 1, name: '张三', voice_part: '高音' },
//                 { _id: 2, name: '李四', voice_part: '中音' },
//                 { _id: 3, name: '王五', voice_part: '低音' },
//             ];
//         },
//         async loadAttendanceRecords() {
//             const { data, error } = await supabaseRequest.select('attendance_records');
//             if (error) {
//                 console.error('加载出勤记录失败:', error);
//                 this.attendanceRecords = [];
//             } else {
//                 this.attendanceRecords = data;
//             }
//         },
//         async showAttendanceDetails(person) {
//             this.selectedPerson = person;
//             const { data, error } = await supabaseRequest.select('attendance_records', {
//                 filter: { person_id: person._id }
//             });
//             if (error) {
//                 console.error('加载出勤详情失败:', error);
//                 this.attendanceDetails = [];
//             } else {
//                 this.attendanceDetails = data;
//             }
//             this.showAttendanceModal = true;
//         },
//     },
//         },
import Vue from 'vue';
import supabaseRequest from './supabaseRequest.js';
export default {
    data() {
        return {
            persons: [],
            attendanceRecords: [],
            selectedPerson: null,
            attendanceDetails: [],
            showAttendanceModal: false,
        };
    },
    methods: {
        async initData() {
            await this.loadMembers();
            await this.loadAttendanceRecords();
        },
        async loadMembers() {
            const { data, error } = await supabaseRequest.select('persons');
            if (error) {
                console.error('加载成员失败:', error);
                this.persons = this.getMockMembers();
            } else {
                this.persons = data;
            }
        },
        getMockMembers() {
            return [
                { _id: 1, name: '张三', voice_part: '高音' },
                { _id: 2, name: '李四', voice_part: '中音' },
                { _id: 3, name: '王五', voice_part: '低音' },
            ];
        },
        async loadAttendanceRecords() {
            const { data, error } = await supabaseRequest.select('attendance_records');
            if (error) {
                console.error('加载出勤记录失败:', error);
                this.attendanceRecords = [];
            } else {
                this.attendanceRecords = data;
            }
        },
        async showAttendanceDetails(person) {
            this.selectedPerson = person;
            const { data, error } = await supabaseRequest.select('attendance_records', {
                filter: { person_id: person._id }
            });
            if (error) {
                console.error('加载出勤详情失败:', error);
                this.attendanceDetails = [];
            } else {
                this.attendanceDetails = data;
            }
            this.showAttendanceModal = true;
        },
    },
    created() {
        this.initData();
    }
};
     },

