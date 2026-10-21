import React, { useMemo } from 'react';
import {
  AID_FAMILY_HEAD_TYPES,
  AID_RELATED_PERSON_TYPES,
  calcAgeFromDob,
  formatMaritalStatus,
} from '../aidConstants';

const relLabel = (type) =>
  AID_RELATED_PERSON_TYPES.find((t) => t.value === type)?.label ||
  AID_FAMILY_HEAD_TYPES.find((t) => t.value === type)?.label ||
  type ||
  'Relative';

const shortRel = (type) => {
  const map = {
    father: 'Father',
    mother: 'Mother',
    spouse: 'Spouse',
    husband: 'Husband',
    wife: 'Wife',
    son: 'Son',
    daughter: 'Daughter',
    child: 'Child',
    brother: 'Brother',
    sister: 'Sister',
    sibling: 'Sibling',
    step_brother: 'Brother',
    step_sister: 'Sister',
    half_brother: 'Brother',
    half_sister: 'Sister',
    grandfather: 'Grandfather',
    grandmother: 'Grandmother',
    maternal_grandfather: 'Grandfather',
    maternal_grandmother: 'Grandmother',
    father_in_law: 'Father-in-law',
    mother_in_law: 'Mother-in-law',
    uncle: 'Uncle',
    aunt: 'Aunt',
    cousin: 'Cousin',
    grandchild: 'Grandchild',
    guardian: 'Guardian',
    other: 'Relative',
  };
  return map[String(type || '').toLowerCase()] || relLabel(type);
};

const relationOf = (p) =>
  String(
    p?._relation_type ||
      p?.relation_type ||
      p?.relation_with_family_head ||
      p?.relation_with_beneficiary ||
      '',
  ).toLowerCase();

const isLate = (p) => p && p.is_alive === false;
const isGuarded = (p) =>
  !!p?.under_guardianship ||
  p?.household_dependency === 'dependent_on_family_head' ||
  /guardianship|dependent under (family head|guardian)/i.test(
    String(p?._notes || p?.notes || ''),
  );

/** Map /aid/people/:id family_tree rows → person with relation. */
const fromApiRows = (rows = [], prefix = 'api') =>
  (rows || [])
    .map((row, i) => {
      const person = row?.person || row;
      if (!person?.id && !person?.full_name) return null;
      return {
        ...person,
        relation_type: row?.relation_type || person.relation_type || '',
        _notes: row?.notes || '',
        under_guardianship: /guardianship|dependent under/i.test(
          String(row?.notes || ''),
        ),
        _tree_id: `${prefix}-${person.id || i}`,
      };
    })
    .filter(Boolean);

const nodeMeta = (person, roleHint) => {
  if (!person) return null;
  const age = calcAgeFromDob(person.date_of_birth);
  const role = roleHint || shortRel(relationOf(person));
  const lines = [];
  if (person.is_family_head) {
    lines.push('FAMILY HEAD');
  } else {
    const bits = [role];
    if (isLate(person)) bits.push('late');
    else if (age != null) bits.push(String(age));
    lines.push(bits.filter(Boolean).join(' - '));
  }
  if (person.is_family_head) {
    const ms = person.marital_status
      ? formatMaritalStatus(person.marital_status)
      : '';
    const ageBit = age != null ? String(age) : '';
    if (ms || ageBit) {
      lines.push([ms, ageBit].filter(Boolean).join(' - '));
    }
  }
  if (!person.is_family_head && isGuarded(person)) {
    lines.push('Guardianship');
  } else if (!person.is_family_head && person.occupation?.trim()) {
    lines.push('Earning');
  } else if (
    !person.is_family_head &&
    !isLate(person) &&
    (person.city || person.district || person.address)
  ) {
    lines.push('In household');
  }
  if (person.education_level === 'primary' || person.student_class) {
    if (!lines.includes('Earning') && !lines.includes('Guardianship')) {
      lines.push('Education');
    }
  }
  return {
    id: person._tree_id,
    name: person.full_name?.trim() || 'Unnamed',
    lines,
    variant: person.is_family_head
      ? 'head'
      : isLate(person)
        ? 'late'
        : isGuarded(person)
          ? 'guardian'
          : 'alive',
    highlight: !!person._highlight,
  };
};

const TreeNode = ({ node, onSelect }) => {
  if (!node) {
    return <div className="aid-ft-node aid-ft-node--empty" aria-hidden />;
  }
  return (
    <button
      type="button"
      className={`aid-ft-node aid-ft-node--${node.variant}${
        node.highlight ? ' is-highlight' : ''
      }`}
      onClick={() => onSelect?.(node)}
    >
      <strong className="aid-ft-node__name">{node.name}</strong>
      {node.lines.map((line, i) => (
        <span key={`${node.id}-${i}`} className="aid-ft-node__line">
          {line.startsWith('Education') || line.includes('benefit') ? (
            <>
              <i className="aid-ft-node__dot" aria-hidden />
              {line}
            </>
          ) : (
            line
          )}
        </span>
      ))}
    </button>
  );
};

const CoupleRow = ({ left, right, onSelect }) => (
  <div className="aid-ft-couple">
    <TreeNode node={left} onSelect={onSelect} />
    {(left || right) && <span className="aid-ft-couple__bar" aria-hidden />}
    <TreeNode node={right} onSelect={onSelect} />
  </div>
);

const SiblingRow = ({ nodes, onSelect }) => {
  if (!nodes.length) return null;
  return (
    <div className="aid-ft-siblings">
      {nodes.length > 1 ? (
        <div className="aid-ft-siblings__rail" aria-hidden />
      ) : null}
      <div className="aid-ft-siblings__nodes">
        {nodes.map((n) => (
          <div key={n.id} className="aid-ft-siblings__item">
            <span className="aid-ft-siblings__stem" aria-hidden />
            <TreeNode node={n} onSelect={onSelect} />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Visual family tree — intake form props and/or API family_tree from /aid/people/:id.
 */
const AidFamilyTreePanel = ({
  familyHeads = [],
  spouse = null,
  beneficiaryMembers = [],
  beneficiary = null,
  headAsBeneficiary = null,
  /** Saved kinship tree from people detail API */
  apiTree = null,
  rootPerson = null,
  emptyHint = 'No family members to show yet. Complete Family Registration first, then return here to see the household tree.',
  showHeader = true,
  selectedId = null,
  onSelectNode,
}) => {
  const model = useMemo(() => {
    const mark = (p, role) =>
      p
        ? nodeMeta(
            {
              ...p,
              _highlight: selectedId === p._tree_id,
            },
            role,
          )
        : null;

    // ——— API mode (entry / case review) ———
    if (apiTree && (rootPerson || beneficiary)) {
      const headSrc = rootPerson || beneficiary;
      const headPerson = headSrc
        ? {
            ...headSrc,
            is_family_head: true,
            _tree_id: `root-${headSrc.id || 'head'}`,
          }
        : null;

      const parents = fromApiRows(apiTree.parents, 'par');
      const grandparents = fromApiRows(apiTree.grandparents, 'gp');
      const father =
        parents.find((p) => relationOf(p) === 'father') ||
        grandparents.find((p) =>
          ['father', 'grandfather'].includes(relationOf(p)),
        ) ||
        null;
      const mother =
        parents.find((p) => relationOf(p) === 'mother') ||
        grandparents.find((p) =>
          ['mother', 'grandmother'].includes(relationOf(p)),
        ) ||
        null;
      const fil =
        grandparents.find((p) =>
          ['maternal_grandfather', 'father_in_law'].includes(relationOf(p)),
        ) ||
        fromApiRows(apiTree.extended, 'ext').find(
          (p) => relationOf(p) === 'father_in_law',
        ) ||
        null;
      const mil =
        grandparents.find((p) =>
          ['maternal_grandmother', 'mother_in_law'].includes(relationOf(p)),
        ) ||
        fromApiRows(apiTree.extended, 'ext').find(
          (p) => relationOf(p) === 'mother_in_law',
        ) ||
        null;

      const spousePerson =
        fromApiRows(apiTree.spouse, 'sp')[0] || null;
      const siblings = [
        ...fromApiRows(apiTree.brothers, 'br'),
        ...fromApiRows(apiTree.sisters, 'sis'),
        ...fromApiRows(apiTree.siblings, 'sib'),
      ];
      const children = [
        ...fromApiRows(apiTree.children, 'ch'),
        ...fromApiRows(apiTree.grandchildren, 'gc'),
      ];
      const extendedGuarded = fromApiRows(apiTree.extended, 'ext').filter(
        (p) => isGuarded(p),
      );

      return {
        paternal: {
          father: mark(father, shortRel(relationOf(father) || 'father')),
          mother: mark(mother, shortRel(relationOf(mother) || 'mother')),
        },
        inlaws: {
          father: mark(fil, 'Father-in-law'),
          mother: mark(mil, 'Mother-in-law'),
        },
        siblings: [...siblings, ...extendedGuarded].map((s) =>
          mark(s, shortRel(relationOf(s))),
        ),
        head: mark(headPerson, 'FAMILY HEAD'),
        spouse: mark(
          spousePerson,
          headPerson?.gender === 'female' ? 'Husband' : 'Wife',
        ),
        children: children.map((c) => mark(c, shortRel(relationOf(c)))),
        hasAny: !!(
          headPerson ||
          father ||
          mother ||
          spousePerson ||
          siblings.length ||
          children.length ||
          fil ||
          mil
        ),
      };
    }

    // ——— Intake form mode ———
    const primaryHead =
      headAsBeneficiary ||
      familyHeads.find((h) => h.is_beneficiary) ||
      familyHeads[0] ||
      null;

    const headPerson = primaryHead
      ? {
          ...primaryHead,
          is_family_head: true,
          _tree_id: 'head-0',
          _highlight: selectedId === 'head-0',
        }
      : beneficiary?.full_name
        ? {
            ...beneficiary,
            is_family_head: true,
            _tree_id: 'beneficiary',
            _highlight: selectedId === 'beneficiary',
          }
        : null;

    const memberPool = [];
    familyHeads.forEach((h, hi) => {
      if (h !== primaryHead && h?.full_name?.trim()) {
        memberPool.push({
          ...h,
          _tree_id: `fh-${hi}`,
          relation_type: h._relation_type || relationOf(h),
        });
      }
      (h._family_members || []).forEach((m, mi) => {
        if (m?.full_name?.trim()) {
          memberPool.push({
            ...m,
            _tree_id: `hm-${hi}-${mi}`,
          });
        }
      });
    });
    (beneficiaryMembers || []).forEach((m, mi) => {
      if (m?.full_name?.trim()) {
        memberPool.push({ ...m, _tree_id: `bm-${mi}` });
      }
    });

    const take = (pred) => {
      const hit = memberPool.find(pred);
      return hit || null;
    };
    const takeAll = (pred) => memberPool.filter(pred);

    const father = take((p) => relationOf(p) === 'father');
    const mother = take((p) => relationOf(p) === 'mother');
    const fil = take(
      (p) =>
        relationOf(p) === 'father_in_law' ||
        (relationOf(p) === 'father' && p !== father),
    );
    const mil = take(
      (p) =>
        relationOf(p) === 'mother_in_law' ||
        (relationOf(p) === 'mother' && p !== mother),
    );

    const spousePerson =
      spouse?.full_name?.trim()
        ? {
            ...spouse,
            _tree_id: 'spouse',
            relation_type:
              headPerson?.gender === 'female' ? 'husband' : 'wife',
          }
        : take((p) => ['spouse', 'husband', 'wife'].includes(relationOf(p)));

    const siblings = takeAll((p) =>
      [
        'brother',
        'sister',
        'sibling',
        'step_brother',
        'step_sister',
        'half_brother',
        'half_sister',
      ].includes(relationOf(p)),
    );

    const children = takeAll((p) =>
      ['son', 'daughter', 'child', 'grandchild'].includes(relationOf(p)),
    );

    return {
      paternal: {
        father: mark(father, 'Father'),
        mother: mark(mother, 'Mother'),
      },
      inlaws: {
        father: mark(fil, 'Father-in-law'),
        mother: mark(mil, 'Mother-in-law'),
      },
      siblings: siblings.map((s) => mark(s)),
      head: mark(headPerson, 'FAMILY HEAD'),
      spouse: mark(
        spousePerson,
        headPerson?.gender === 'female' ? 'Husband' : 'Wife',
      ),
      children: children.map((c) => mark(c)),
      hasAny: !!(
        headPerson ||
        father ||
        mother ||
        spousePerson ||
        siblings.length ||
        children.length
      ),
    };
  }, [
    apiTree,
    rootPerson,
    familyHeads,
    spouse,
    beneficiaryMembers,
    beneficiary,
    headAsBeneficiary,
    selectedId,
  ]);

  if (!model.hasAny) {
    return (
      <div className="aid-ft aid-ft--empty">
        <p>{emptyHint}</p>
      </div>
    );
  }

  const hasPaternal = model.paternal.father || model.paternal.mother;
  const hasInlaws = model.inlaws.father || model.inlaws.mother;
  const midRow = [
    ...model.siblings.filter(Boolean),
    model.head,
    model.spouse,
  ].filter(Boolean);

  return (
    <div className="aid-ft">
      <header className="aid-ft__header">
        <h3 className="form-section-heading" style={{ margin: 0 }}>
          Family Tree
        </h3>
        <p className="aid-section-hint" style={{ margin: '0.35rem 0 0' }}>
          Visual map of the household from Family Registration. Styles mark the
          family head, late members, and those under guardianship.
        </p>
      </header>

      <div className="aid-ft__canvas">
        {(hasPaternal || hasInlaws) && (
          <div className="aid-ft__gen aid-ft__gen--top">
            {hasPaternal ? (
              <div className="aid-ft__branch">
                <CoupleRow
                  left={model.paternal.father}
                  right={model.paternal.mother}
                  onSelect={onSelectNode}
                />
                <span className="aid-ft__drop" aria-hidden />
              </div>
            ) : (
              <div className="aid-ft__branch aid-ft__branch--spacer" />
            )}
            {hasInlaws ? (
              <div className="aid-ft__branch">
                <CoupleRow
                  left={model.inlaws.father}
                  right={model.inlaws.mother}
                  onSelect={onSelectNode}
                />
                <span className="aid-ft__drop" aria-hidden />
              </div>
            ) : (
              <div className="aid-ft__branch aid-ft__branch--spacer" />
            )}
          </div>
        )}

        <div className="aid-ft__gen aid-ft__gen--mid">
          {(hasPaternal || hasInlaws) && midRow.length > 1 ? (
            <div className="aid-ft__mid-rail" aria-hidden />
          ) : null}
          <div className="aid-ft__mid-row">
            {model.siblings.map((n) => (
              <div key={n.id} className="aid-ft__mid-item">
                <span className="aid-ft__mid-stem" aria-hidden />
                <TreeNode node={n} onSelect={onSelectNode} />
              </div>
            ))}
            {model.head ? (
              <div className="aid-ft__mid-item aid-ft__mid-item--head">
                <span className="aid-ft__mid-stem" aria-hidden />
                <div className="aid-ft-couple aid-ft-couple--head">
                  <TreeNode node={model.head} onSelect={onSelectNode} />
                  {model.spouse ? (
                    <>
                      <span className="aid-ft-couple__bar" aria-hidden />
                      <TreeNode node={model.spouse} onSelect={onSelectNode} />
                    </>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {model.children.length ? (
          <div className="aid-ft__gen aid-ft__gen--kids">
            <span className="aid-ft__drop aid-ft__drop--kids" aria-hidden />
            <SiblingRow nodes={model.children} onSelect={onSelectNode} />
          </div>
        ) : null}
      </div>

      <div className="aid-ft__legend">
        <span>
          <i className="aid-ft-swatch aid-ft-swatch--head" /> Family head
        </span>
        <span>
          <i className="aid-ft-swatch aid-ft-swatch--alive" /> In household
        </span>
        <span>
          <i className="aid-ft-swatch aid-ft-swatch--late" /> Late
        </span>
        <span>
          <i className="aid-ft-swatch aid-ft-swatch--guardian" /> Guardianship
        </span>
      </div>
    </div>
  );
};

export default AidFamilyTreePanel;
