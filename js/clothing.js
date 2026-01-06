// 服装管理组件
Vue.component('clothing-management', {
    props: ['persons', 'clothingRecords'],
    template: `
        <div>
            <!-- 服装库存管理 -->
            <div class="section">
                <div class="section-title">
                    <span>服装库存管理</span>
                    <button class="btn" @click="showInventoryModal = true">管理库存</button>
                </div>
                
                <!-- 男生服装 -->
                <div class="gender-section">
                    <div class="gender-title">男生服装</div>
                    <div class="clothing-grid">
                        <div class="clothing-item" v-for="item in maleClothing" :key="item.type">
                            <div class="clothing-title">{{ item.name }}</div>
                            <div v-for="size in maleSizes" :key="size" class="size-count">
                                {{ size }}: {{ getAvailableCount('male', item.type, size) }}件
                                <span class="clothing-status" :class="getStockStatus('male', item.type, size)">
                                    {{ getStockStatusText('male', item.type, size) }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 女生服装 -->
                <div class="gender-section">
                    <div class="gender-title">女生服装</div>
                    <div class="clothing-grid">
                        <div class="clothing-item" v-for="item in femaleClothing" :key="item.type">
                            <div class="clothing-title">{{ item.name }}</div>
                            <div v-for="size in femaleSizes" :key="size" class="size-count">
                                {{ size }}: {{ getAvailableCount('female', item.type, size) }}件
                                <span class="clothing-status" :class="getStockStatus('female', item.type, size)">
                                    {{ getStockStatusText('female', item.type, size) }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 借出记录 -->
            <div class="section">
                

                <!-- 搜索框 -->
                <div class="form-group" style="margin-bottom:10px;">
                    <input type="text" class="form-control" v-model="searchKeyword" placeholder="按姓名或学号搜索">
                </div>

                <!-- 男生 -->
                <div class="table-container" v-if="filteredMaleRecords.length">
                    <div class="gender-title">男生</div>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>学号</th>
                                <th>姓名</th>
                                <th>声部</th>
                                <th>适合尺寸</th>
                                <th>是否借出</th>
                                <th>借出尺码</th>
                                <th>备注</th>
                                
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="record in filteredMaleRecords" :key="record.id">
                                <td>{{ getStudentNumber(record.memberId) }}</td>
                                <td>{{ record.memberName }}</td>
                                <td>{{ getVoicePartText(getVoicePart(record.memberId)) }}</td>
                                <td>
                                    <select class="form-control" v-model="record.borrowedSize"
                                            @change="updateClothingRecord(record)" >
                                        <option value="">请选择</option>
                                        <option v-for="size in maleSizes" :key="size" :value="size">{{ size }}</option>
                                    </select>
                                </td>
                                <td>
                                    <input type="checkbox" v-model="record.isBorrowed" @change="updateClothingRecord(record)">
                                </td>
                                <td>
                                    <select class="form-control" v-model="record.borrowedSize"
                                            @change="updateClothingRecord(record)" :disabled="!record.isBorrowed">
                                        <option value="">请选择</option>
                                        <option v-for="size in maleSizes" :key="size" :value="size">{{ size }}</option>
                                    </select>
                                </td>
                                <td>
                                    <input type="text" class="form-control" v-model="record.notes"
                                           @change="updateClothingRecord(record)" placeholder="备注">
                                </td>
                                
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- 女生 -->
                <div class="table-container" v-if="filteredFemaleRecords.length">
                    <div class="gender-title">女生</div>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>学号</th>
                                <th>姓名</th>
                                <th>声部</th>
                                <th>适合尺码</th>
                                <th>是否借出</th>
                                <th>借出尺码</th>
                                <th>备注</th>
                                
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="record in filteredFemaleRecords" :key="record.id">
                                <td>{{ getStudentNumber(record.memberId) }}</td>
                                <td>{{ record.memberName }}</td>
                                <td>{{ getVoicePartText(getVoicePart(record.memberId)) }}</td>
                                <td>
                                    <select class="form-control" v-model="record.suitableSize"
                                            @change="updateClothingRecord(record)" >
                                        <option value="">请选择</option>
                                        <option v-for="size in femaleSizes" :key="size" :value="size">{{ size }}</option>
                                    </select>
                                </td>
                                <td>
                                    <input type="checkbox" v-model="record.isBorrowed" @change="updateClothingRecord(record)">
                                </td>
                                <td>
                                    <select class="form-control" v-model="record.borrowedSize"
                                            @change="updateClothingRecord(record)" :disabled="!record.isBorrowed">
                                        <option value="">请选择</option>
                                        <option v-for="size in femaleSizes" :key="size" :value="size">{{ size }}</option>
                                    </select>
                                </td>
                                <td>
                                    <input type="text" class="form-control" v-model="record.notes"
                                           @change="updateClothingRecord(record)" placeholder="备注">
                                </td>
                                
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            






            <!-- 库存管理模态框 -->
            <div class="modal-overlay" v-if="showInventoryModal" @click="showInventoryModal = false">
                <div class="modal-content" @click.stop style="max-width:500px;">
                    <div class="modal-title">服装库存管理</div>

                    <!-- 男生库存 -->
                    <div class="gender-section">
                        <div class="gender-title">男生服装库存</div>
                        <div v-for="item in maleClothing" :key="item.type" class="inventory-controls">
                            <div class="clothing-title">{{ item.name }}</div>
                            <div class="inventory-list">
                                <div v-for="size in maleSizes" :key="size" class="inventory-item">
                                    <span>尺码 {{ size }}:</span>
                                    <input type="number" class="size-input" v-model="inventory.male[item.type][size]" min="0">
                                    <span>件 (已借出: {{ getBorrowedCount('male', item.type, size) }}件)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 女生库存 -->
                    <div class="gender-section">
                        <div class="gender-title">女生服装库存</div>
                        <div v-for="item in femaleClothing" :key="item.type" class="inventory-controls">
                            <div class="clothing-title">{{ item.name }}</div>
                            <div class="inventory-list">
                                <div v-for="size in femaleSizes" :key="size" class="inventory-item">
                                    <span>尺码 {{ size }}:</span>
                                    <input type="number" class="size-input" v-model="inventory.female[item.type][size]" min="0">
                                    <span>件 (已借出: {{ getBorrowedCount('female', item.type, size) }}件)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="btn-group">
                        <button class="btn" @click="saveInventory">保存库存</button>
                        <button class="btn" @click="showInventoryModal = false">取消</button>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            showAddClothingModal: false,
            showEditClothingModal: false,
            showInventoryModal: false,
            searchKeyword: '',
            editingClothingRecord: null, // 当前编辑的记录对象
            selectedSize: '',            // 弹框选中的尺码
            isBorrowed: false,
            notes: '',
            currentRecord: {
                memberId: '',
                memberName: '',
                gender: 'male',
                suitableSize:'',
                isBorrowed: false,
                borrowedSize: '',
                notes: ''
            },
            maleSizes: ['165', '170', '175', '180', '185','190','195'],
            femaleSizes: ['S', 'M', 'L', 'XL','XXL','定制'],
            maleClothing: [{ type: 'suit', name: '西装' }],
            femaleClothing: [{ type: 'dress', name: '裙子' }],
            inventory: {
                male: { suit: { '165': 10, '170': 10, '175': 10, '180': 10, '185': 10, '190': 10, '195': 10 } },
                female: { dress: { 'S': 10, 'M': 10, 'L': 10, 'XL': 10, 'XXL': 10, '定制': 10 } }
            }
        };
    },
    computed: {
        filteredMaleRecords() {
            return this.clothingRecords.filter(r =>
                r.gender === 'male' &&
                this.matchSearch(r)
            );
        },
        filteredFemaleRecords() {
            return this.clothingRecords.filter(r =>
                r.gender === 'female' &&
                this.matchSearch(r)
            );
        }
    },
    methods: {
        // 当选择成员时自动填姓名和性别
        onMemberSelect() {
            if (!this.currentRecord.memberId) return;

            const member = this.persons.find(m => m.id === this.currentRecord.memberId);
            if (member) {
                this.currentRecord.memberName = member.name;
                this.currentRecord.gender = (member.voice_part === 'tenor' || member.voice_part === 'bass') ? 'male' : 'female';
            }
        },

        // 新增服装记录
        async addClothingRecord() {
            if (!this.currentRecord.memberId) {
                alert('请选择成员');
                return;
            }

            const member = this.persons.find(m => m.id === this.currentRecord.memberId);
            if (!member) {
                alert('成员不存在');
                return;
            }

            const gender = (member.voice_part === 'tenor' || member.voice_part === 'bass') ? 'male' : 'female';

            const newRecord = {
                member_id: member.id,
                member_name: member.name,
                gender: gender,
                suitable_size: this.currentRecord.suitableSize || '',
                is_borrowed: this.currentRecord.isBorrowed || false,
                borrowed_size: this.currentRecord.borrowedSize || '',
                notes: this.currentRecord.notes || ''
            };

            try {
                const { error } = await supabaseRequest.insert('clothing_records', newRecord);
                if (error) throw new Error(error.message || '添加失败');

                alert('服装记录添加成功');
                this.$emit('clothing-record-added');
                this.closeModal();
                this.resetCurrentRecord();
            } catch (err) {
                alert('添加失败: ' + err.message);
            }
        },

        // 重置 currentRecord
        resetCurrentRecord() {
            this.currentRecord = {
                memberId: null,
                memberName: '',
                gender: 'male',
                suitableSize: '',
                isBorrowed: false,
                borrowedSize: '',
                notes: ''
            };
        },

        // 关闭模态框
        closeModal() {
            this.showAddClothingModal = false;
            this.showEditClothingModal = false;
            this.resetCurrentRecord();
        }
,

        resetCurrentRecord() {
            this.currentRecord = {
                memberId: '',
                memberName: '',
                gender: 'male',
                suitableSize: '',
                isBorrowed: false,
                borrowedSize: '',
                notes: ''
            };
        },

        closeModal() {
            this.showAddClothingModal = false;
            this.showEditClothingModal = false;
            this.resetCurrentRecord();
        },


        matchSearch(record) {
            const keyword = this.searchKeyword.trim().toLowerCase();
            const member = this.persons.find(m => m._id === record.memberId);
            if (!keyword) return true;
            return (
                (record.memberName && record.memberName.toLowerCase().includes(keyword)) ||
                (member && member.studentId && member.studentId.toLowerCase().includes(keyword))
            );
        },
        getStudentNumber(memberId) {
            const member = this.persons.find(m => m._id === memberId);
            return member ? member.studentId || '—' : '—';
        },
        getVoicePart(memberId) {
            const member = this.persons.find(m => m._id === memberId);
            return member ? member.voicePart : '';
        },
        getVoicePartText(v) { return { tenor: '男高', bass: '男低', soprano: '女高', alto: '女低' }[v] || '未知'; },
        getSizesByGender(g) { return g === 'male' ? this.maleSizes : this.femaleSizes; },
        getSuitableSize(record) {
            return record.suitableSize || '-';
        },
        getAvailableCount(gender, type, size) {
            const total = this.inventory[gender][type][size] || 0;
            const borrowed = this.getBorrowedCount(gender, type, size);
            return Math.max(0, total - borrowed);
        },
        getBorrowedCount(gender, type, size) {
            return this.clothingRecords.filter(r => r.gender === gender && r.isBorrowed && r.borrowedSize === size).length;
        },
        getStockStatus(gender, type, size) {
            return this.getAvailableCount(gender, type, size) > 0 ? 'status-available' : 'status-borrowed';
        },
        getStockStatusText(gender, type, size) {
            return this.getAvailableCount(gender, type, size) > 0 ? '充足' : '缺货';
        },
        onMemberSelect() {
            const member = this.persons.find(m => m.id === this.currentRecord.memberId);
            if (member) {
                this.currentRecord.memberName = member.name;
                this.currentRecord.gender = (member.voice_part === 'tenor' || member.voice_part === 'bass') ? 'male' : 'female';
            }
        }
,
        onGenderChange() { this.currentRecord.borrowedSize = ''; },
        editClothingRecord(record) { this.currentRecord = { ...record }; this.showEditClothingModal = true; },
        closeModal() { this.showAddClothingModal = false; this.showEditClothingModal = false; this.resetCurrentRecord(); },
        resetCurrentRecord() {
            this.currentRecord = { memberId: '', memberName: '', gender: 'male', isBorrowed: false, borrowedSize: '', notes: '' };
        },
        //这里添加新建记录的函数

        // 更新已有记录
        async updateClothingRecord(record) {
            try {
                const { error } = await supabaseRequest.update('clothing_records', record.id, {
                    suitable_size:record.suitableSize,
                    is_borrowed: record.isBorrowed,
                    borrowed_size: record.borrowedSize,
                    notes: record.notes
                });

                if (error) throw new Error('更新失败');

                this.$emit('clothing-record-updated');
            } catch (error) {
                alert('更新失败: ' + error.message);
            }
        },

        // 删除记录
        async deleteClothingRecord(record) {
            if (!confirm(`确定要删除 ${record.memberName} 的服装记录吗？`)) {
                return;
            }

            try {
                const { error } = await supabaseRequest.delete('clothing_records', record.id);

                if (error) throw new Error('删除失败');

                this.$emit('clothing-record-deleted');
                alert('服装记录删除成功');
            } catch (error) {
                alert('删除失败: ' + error.message);
            }
        },
        saveInventory() { localStorage.setItem('clothing_inventory', JSON.stringify(this.inventory)); alert('库存保存成功'); }
    },
    mounted() {
        const saved = localStorage.getItem('clothing_inventory');
        if (saved) this.inventory = JSON.parse(saved);
    }
});
