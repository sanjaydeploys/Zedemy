import React, { memo, useMemo } from 'react';
import styled from 'styled-components';
import { parseLinks } from './utils';

// Shared styles
const sharedSectionStyles = `
  margin-top: 1.5rem;
  padding: 1.25rem;
  background: #0f172a; /* dark background */
  border-radius: 0.5rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
  overflow-x: auto;
`;

// Styled components
const ComparisonTableContainer = styled.section`
  ${sharedSectionStyles}
`;

const ResponsiveContent = styled.div`
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
`;

const ResponsiveTable = styled.table`
  border-collapse: collapse;
  min-width: 800px;
  width: 100%;
  font-size: 0.875rem;
  table-layout: auto;
  color: #f8fafc;
`;

const ResponsiveHeader = styled.th`
  background: #1e293b;
  color: #f8fafc;
  padding: 0.75rem 1rem;
  border: 1px solid #334155;
  font-weight: 600;
  text-align: left;
  vertical-align: middle;
  min-width: ${(props) => (props.isAttribute ? '200px' : '180px')};
`;

const ResponsiveCell = styled.td`
  border: 1px solid #334155;
  padding: 0.75rem 1rem;
  vertical-align: top;
  background: ${(props) => (props.index % 2 === 0 ? '#1e293b' : '#0f172a')};
  line-height: 1.5;
`;

const Caption = styled.caption`
  font-size: 0.875rem;
  color: #94a3b8;
  margin-bottom: 0.5rem;
  text-align: left;
  font-weight: 500;
`;

const ItemTitle = styled.strong`
  display: block;
  font-weight: 600;
  color: #f1f5f9;
  margin-bottom: 0.25rem;
`;

const BulletList = styled.ul`
  padding-left: 1.25rem;
  margin: 0;
  list-style-type: disc;
`;

const BulletItem = styled.li`
  margin-bottom: 0.25rem;
  color: #cbd5e1;
`;

const ComparisonTable = memo(({ superTitles, category }) => {
  if (!Array.isArray(superTitles) || superTitles.length === 0 || !superTitles.some(st => st.superTitle && st.attributes?.length > 0)) {
    return null;
  }

  const parsedSuperTitles = useMemo(
    () =>
      superTitles.map((st) => ({
        ...st,
        superTitle: parseLinks(st.superTitle || '', category, true),
        attributes: (st.attributes || []).map((attr) => ({
          ...attr,
          attribute: parseLinks(attr.attribute || '', category, true),
          items: (attr.items || []).map((item) => ({
            ...item,
            title: parseLinks(item.title || 'N/A', category, true),
            bulletPoints: (item.bulletPoints || []).map((point) => parseLinks(point || 'N/A', category, true)),
          })),
        })),
      })),
    [superTitles, category]
  );

  return (
    <ComparisonTableContainer aria-labelledby="comparison-heading">
      <h2
        id="comparison-heading"
        style={{
          fontSize: '1.25rem',
          fontWeight: '700',
          color: '#f8fafc',
          marginBottom: '1rem',
          borderLeft: '4px solid #34db58',
          paddingLeft: '0.5rem',
        }}
      >
        Comparison
      </h2>
      <ResponsiveContent>
        <ResponsiveTable>
          <Caption>Comparison of {category || 'features'}</Caption>
          <thead>
            <tr>
              <ResponsiveHeader scope="col" isAttribute>
                Attribute
              </ResponsiveHeader>
              {parsedSuperTitles.map(
                (st, i) =>
                  st.superTitle && (
                    <ResponsiveHeader key={i} scope="col" dangerouslySetInnerHTML={{ __html: st.superTitle }} />
                  )
              )}
            </tr>
          </thead>
          <tbody>
            {parsedSuperTitles[0]?.attributes.map((attr, index) => (
              <tr key={index}>
                <ResponsiveCell scope="row" index={index} dangerouslySetInnerHTML={{ __html: attr.attribute }} />
                {parsedSuperTitles.map((st, stIdx) => {
                  const itemGroup = st.attributes[index]?.items;
                  return (
                    <ResponsiveCell key={stIdx} index={index}>
                      {itemGroup?.length > 0
                        ? itemGroup.map((item, itemIdx) => (
                            <div key={itemIdx} style={{ marginBottom: '0.5rem' }}>
                              <ItemTitle dangerouslySetInnerHTML={{ __html: item.title }} />
                              {item.bulletPoints?.length > 0 && (
                                <BulletList>
                                  {item.bulletPoints.map((point, pIdx) => (
                                    <BulletItem key={pIdx} dangerouslySetInnerHTML={{ __html: point }} />
                                  ))}
                                </BulletList>
                              )}
                            </div>
                          ))
                        : 'N/A'}
                    </ResponsiveCell>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </ResponsiveTable>
      </ResponsiveContent>
    </ComparisonTableContainer>
  );
});

export default ComparisonTable;
