import React, { useState, useEffect, useRef } from 'react';
import { Select, Button, Space } from 'antd';
import { DownOutlined } from '@ant-design/icons';

interface MobileSelectProps {
  value?: any;
  onChange?: (value: any) => void;
  options?: Array<{ value: any; label: string }>;
  placeholder?: string;
  mode?: 'multiple' | 'tags';
  allowClear?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

const MobileSelect: React.FC<MobileSelectProps> = ({
  value,
  onChange,
  options = [],
  placeholder = "请选择",
  mode,
  allowClear = false,
  disabled = false,
  style,
  className
}) => {
  const [open, setOpen] = useState(false);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const selectRef = useRef<any>(null);

  // 更新选中标签
  useEffect(() => {
    if (value) {
      if (mode === 'multiple' && Array.isArray(value)) {
        const labels = value.map(v => {
          const option = options.find(opt => opt.value === v);
          return option ? option.label : v;
        });
        setSelectedLabels(labels);
      } else {
        const option = options.find(opt => opt.value === value);
        setSelectedLabels(option ? [option.label] : []);
      }
    } else {
      setSelectedLabels([]);
    }
  }, [value, options, mode]);

  // 处理选择
  const handleChange = (newValue: any) => {
    if (onChange) {
      onChange(newValue);
    }
  };

  // 处理清除
  const handleClear = () => {
    if (onChange) {
      onChange(mode === 'multiple' ? [] : undefined);
    }
  };

  // 获取显示文本
  const getDisplayText = () => {
    if (selectedLabels.length === 0) {
      return placeholder;
    }
    if (mode === 'multiple') {
      if (selectedLabels.length === 1) {
        return selectedLabels[0];
      }
      return `已选择 ${selectedLabels.length} 项`;
    }
    return selectedLabels[0];
  };

  // 检测移动端
  const isMobile = () => {
    return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  return (
    <div style={{ position: 'relative', ...style }} className={className}>
      {/* 移动端显示按钮 */}
      {isMobile() ? (
        <Button
          onClick={() => setOpen(true)}
          disabled={disabled}
          style={{
            width: '100%',
            textAlign: 'left',
            justifyContent: 'space-between',
            height: '32px',
            border: '1px solid #d9d9d9',
            borderRadius: '6px',
            backgroundColor: disabled ? '#f5f5f5' : '#fff',
            color: selectedLabels.length > 0 ? '#000' : '#bfbfbf',
            padding: '4px 11px',
            fontSize: '14px',
            lineHeight: '1.5715',
            ...(allowClear && selectedLabels.length > 0 && {
              paddingRight: '24px'
            })
          }}
        >
          <span style={{ 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap',
            flex: 1
          }}>
            {getDisplayText()}
          </span>
          <Space>
            {allowClear && selectedLabels.length > 0 && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                style={{
                  color: '#999',
                  cursor: 'pointer',
                  fontSize: '12px',
                  marginRight: '4px'
                }}
              >
                ✕
              </span>
            )}
            <DownOutlined style={{ fontSize: '12px', color: '#999' }} />
          </Space>
        </Button>
      ) : (
        // 桌面端使用原生Select
        <Select
          ref={selectRef}
          value={value}
          onChange={handleChange}
          options={options}
          placeholder={placeholder}
          mode={mode}
          allowClear={allowClear}
          disabled={disabled}
          style={{ width: '100%' }}
        />
      )}

      {/* 移动端弹窗 */}
      {isMobile() && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            display: open ? 'flex' : 'none',
            flexDirection: 'column',
            justifyContent: 'flex-end'
          }}
          onClick={() => setOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderTopLeftRadius: '12px',
              borderTopRightRadius: '12px',
              padding: '16px',
              maxHeight: '60vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 标题栏 */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              paddingBottom: '12px',
              borderBottom: '1px solid #f0f0f0'
            }}>
              <span style={{ fontSize: '16px', fontWeight: '500' }}>
                {placeholder}
              </span>
              <Button
                type="text"
                onClick={() => setOpen(false)}
                style={{ padding: '0', minWidth: 'auto' }}
              >
                ✕
              </Button>
            </div>

            {/* 选项列表 */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              maxHeight: '300px'
            }}>
              {options.map((option) => {
                const isSelected = mode === 'multiple' 
                  ? Array.isArray(value) && value.includes(option.value)
                  : value === option.value;

                return (
                  <div
                    key={option.value}
                    onClick={() => {
                      if (mode === 'multiple') {
                        const newValue = Array.isArray(value) ? [...value] : [];
                        if (isSelected) {
                          const index = newValue.indexOf(option.value);
                          if (index > -1) {
                            newValue.splice(index, 1);
                          }
                        } else {
                          newValue.push(option.value);
                        }
                        handleChange(newValue);
                      } else {
                        handleChange(option.value);
                        setOpen(false);
                      }
                    }}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #f5f5f5',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? '#e6f7ff' : '#fff',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '14px',
                      lineHeight: '1.5'
                    }}
                  >
                    <span>{option.label}</span>
                    {isSelected && (
                      <span style={{ color: '#1890ff', fontSize: '16px' }}>✓</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 底部按钮 */}
            {mode === 'multiple' && (
              <div style={{
                marginTop: '16px',
                paddingTop: '12px',
                borderTop: '1px solid #f0f0f0',
                display: 'flex',
                gap: '8px'
              }}>
                <Button
                  onClick={handleClear}
                  style={{ flex: 1 }}
                  disabled={!value || (Array.isArray(value) && value.length === 0)}
                >
                  清除
                </Button>
                <Button
                  type="primary"
                  onClick={() => setOpen(false)}
                  style={{ flex: 1 }}
                >
                  确定
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileSelect;
